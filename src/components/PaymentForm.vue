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
  <form class="form_container col-6" @submit.prevent="handleSubmit">
    <h1 class="form_title">Введите ваши данные</h1>

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

<!--    <div class="col-12">-->
      <!-- Выпадающий список -->
      <label class="custom-input" for="payment-type">
        Тип платежа:
        <select v-model="paymentType" id="payment-type" class="custom-dropdown">
          <option value="one-time">Разовый платёж</option>
          <option value="subscription">Подписка (ежемесячно)</option>
        </select>
      </label>

      <!-- Поле для данных карты -->
      <div class="custom-input">
        <label for="card-element">
          Данные карты:
        </label>
        <div id="card-element" class="custom-card-input"></div>
      </div>


      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
<!--    </div>-->

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
.form_container {
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

.form_title {
  font-size: 30px;
  margin-bottom: 20px;
  text-align: center;
}
.custom-input {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 16px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  color: #333;
  max-width: 400px;
}

.custom-dropdown {
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s, box-shadow 0.3s;
  background-color: #f9f9f9;
  width: 100%;
  appearance: none; /* Убираем стандартные стрелки браузера */
  background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23aaa' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
}

.custom-dropdown:hover {
  border-color: #888;
}

.custom-dropdown:focus {
  border-color: #43a3d9;
  box-shadow: 0 0 4px rgb(52, 127, 166);
}

/* Поле ввода данных карты (Stripe Elements) */
.custom-card-input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 14px;
  background-color: #f9f9f9;
  transition: border-color 0.3s, box-shadow 0.3s;
  width: 100%;
}

/* Hover и Focus для Card Input */
.custom-card-input:hover {
  border-color: #888;
}

.custom-card-input:focus-within {
  border-color: #43a3d9;
  box-shadow: 0 0 4px rgb(52, 127, 166);
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
}

.custom-button {
  margin-top: 20px; /* Отступ сверху для кнопки */
}

/* Адаптивность */
@media (max-width: 768px) {
  .custom-input {
    align-items: center;
    text-align: center;
  }
}
</style>
