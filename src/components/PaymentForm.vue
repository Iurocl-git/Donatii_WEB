<script setup>
import { ref, onMounted, reactive, watch } from "vue";
import { loadStripe } from "@stripe/stripe-js";
import api from "@/API/axios.js";
import CustomButton from "@/components/custom-button.vue";
import CustomInput from "@/components/custom-input.vue";

// Инициализация Stripe
const stripePromise = loadStripe("your-publishable-key"); // Вставьте ваш публичный ключ Stripe

// Состояние
const paymentType = ref("one-time"); // "one-time" или "subscription"
const errorMessage = ref(null);
const isProcessing = ref(false);
const successMessage = ref(null);

// Ссылки на Stripe Elements
const cardElement = ref(null);
const elements = ref(null);

// Данные формы и их валидация
const formData = ref({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
});

const validationState = reactive({
  isEmailValid: false,
  isFirstNameValid: false,
  isLastNameValid: false,
  isPhoneValid: false,
  isValid: false, // Глобальный флаг валидности всей формы
});

const nameRegex = /^(?!\s*$)[a-zA-Zа-яА-ЯёЁ]{1,20}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^\+?[1-9]\d{0,2}[-\s]?(\(\d{1,4}\)[-\s]?)?\d{1,10}([-\\s]?\d{1,10}){0,4}$/;

// Функция для обработки платежа
const handleSubmit = async () => {
  errorMessage.value = null;

  const stripe = await stripePromise;
  if (!stripe) {
    errorMessage.value = "Ошибка инициализации Stripe.";
    return;
  }

  if (!validationState.isValid) {
    errorMessage.value = "Форма содержит ошибки.";
    return;
  }

  isProcessing.value = true;

  try {
    // Создаём Payment Method через Stripe Elements
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement.value,
      billing_details: {
        name: `${formData.value.firstName} ${formData.value.lastName}`,
        email: formData.value.email,
      },
    });

    if (error) {
      errorMessage.value = error.message;
      return;
    }

    if (paymentType.value === "one-time") {
      // Разовый платёж
      const paymentIntentResponse = await api.post("/pay", {
        amount: 1000,
        currency: "USD",
        paymentMethodId: paymentMethod.id,
      });

      const { clientSecret } = paymentIntentResponse.data;

      const confirmResult = await stripe.confirmCardPayment(clientSecret);
      if (confirmResult.error) {
        errorMessage.value = confirmResult.error.message;
        return;
      }

      successMessage.value = "Разовый платёж успешно завершён!";
    } else if (paymentType.value === "subscription") {
      // Подписка
      const subscriptionResponse = await api.post("/create-subscription", {
        paymentMethodId: paymentMethod.id,
        customerName: `${formData.value.firstName} ${formData.value.lastName}`,
        customerEmail: formData.value.email,
      });

      const { clientSecret, status } = subscriptionResponse.data;

      if (status === "requires_action") {
        const confirmResult = await stripe.confirmCardPayment(clientSecret);
        if (confirmResult.error) {
          errorMessage.value = confirmResult.error.message;
          return;
        }
      }

      successMessage.value = "Подписка успешно оформлена!";
    }
  } catch (err) {
    errorMessage.value = "Ошибка при обработке платежа.";
    console.error(err);
  } finally {
    isProcessing.value = false;
  }
};

// Инициализация Stripe Elements
onMounted(async () => {
  const stripe = await stripePromise;

  if (!stripe) {
    errorMessage.value = "Ошибка инициализации Stripe.";
    return;
  }

  elements.value = stripe.elements();
  cardElement.value = elements.value.create("card");
  cardElement.value.mount("#card-element");
});

// Автоматическая проверка валидности формы
watch(
  () => ({
    isEmailValid: validationState.isEmailValid,
    isFirstNameValid: validationState.isFirstNameValid,
    isLastNameValid: validationState.isLastNameValid,
    isPhoneValid: validationState.isPhoneValid,
  }),
  (newState) => {
    validationState.isValid =
      newState.isEmailValid &&
      newState.isFirstNameValid &&
      newState.isLastNameValid &&
      newState.isPhoneValid;
  },
  { immediate: true }
);
</script>

<template>
  <form class="login_container col-5" @submit.prevent="handleSubmit">
    <h1 class="login_title">Введите ваши данные</h1>

    <!-- Поля формы -->
    <custom-input
      label="Фамилия"
      :regex="nameRegex"
      @valid="validationState.isLastNameValid = $event"
      @input="formData.lastName = $event"
    />
    <custom-input
      label="Имя"
      :regex="nameRegex"
      @valid="validationState.isFirstNameValid = $event"
      @input="formData.firstName = $event"
    />
    <custom-input
      label="Email"
      :regex="emailRegex"
      @valid="validationState.isEmailValid = $event"
      @input="formData.email = $event"
    />
    <custom-input
      label="Телефон"
      :regex="phoneRegex"
      @valid="validationState.isPhoneValid = $event"
      @input="formData.phone = $event"
    />

    <!-- Выбор типа платежа -->
    <label for="payment-type" class="form-label">Тип платежа:</label>
    <select id="payment-type" v-model="paymentType" class="payment-type-select">
      <option value="one-time">Разовый платёж</option>
      <option value="subscription">Подписка (ежемесячно)</option>
    </select>

    <!-- Поле для ввода данных карты -->
    <label for="card-element" class="form-label">Данные карты:</label>
    <div id="card-element" class="stripe-element"></div>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <!-- Кнопка отправки -->
    <custom-button
      :label="isProcessing ? 'Обработка...' : paymentType === 'one-time' ? 'Оплатить' : 'Оформить подписку'"
      variant="primary"
      type="submit"
      :disabled="!validationState.isValid || isProcessing"
      class="submit-button"
    />

    <p v-if="successMessage" class="success">{{ successMessage }}</p>
  </form>
</template>

<style scoped>
.login_container {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
  background-color: navajowhite;
  padding: 20px 30px;
  border-radius: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
}

.login_title {
  font-size: 30px;
  margin-bottom: 20px;
  text-align: center;
}

.payment-type-select,
.stripe-element {
  width: 100%;
  margin-bottom: 16px;
}

.error {
  color: red;
  margin-top: 10px;
}

.success {
  color: green;
  margin-top: 10px;
}

.custom-input {
  width: 100%; /* Поля ввода занимают всю ширину контейнера */
  margin-bottom: 16px; /* Отступ между элементами */
}

.custom-button {
  margin-top: 20px; /* Отступ сверху для кнопки */
  align-self: center; /* Центрируем кнопку отдельно */
}
</style>
