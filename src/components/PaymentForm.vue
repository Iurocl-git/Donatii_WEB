<script setup>
import { ref, onMounted } from "vue";
import { loadStripe } from "@stripe/stripe-js";
import api from "@/API/axios.js"; // Импорт вашего API

// Инициализация Stripe
const stripePromise = loadStripe("your-publishable-key"); // Замените на ваш публичный ключ Stripe

// Состояние
const paymentType = ref("one-time"); // "one-time" или "subscription"
const errorMessage = ref(null);
const isProcessing = ref(false);
const successMessage = ref(null);

// Ссылки на Stripe Elements
const cardElement = ref(null);
const elements = ref(null);

// Функция для обработки платежа
const handleSubmit = async () => {
  errorMessage.value = null;

  const stripe = await stripePromise;
  if (!stripe) {
    errorMessage.value = "Ошибка инициализации Stripe.";
    return;
  }

  isProcessing.value = true;

  try {
    // 1. Создаём Payment Method через Stripe Elements
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement.value,
      billing_details: {
        name: "Test User", // Здесь можно указать имя пользователя
      },
    });

    if (error) {
      errorMessage.value = error.message;
      return;
    }

    // 2. Разовый платёж или подписка
    if (paymentType.value === "one-time") {
      // Обработка разового платежа
      const paymentIntentResponse = await api.post("/pay", {
        amount: 1000, // Сумма в центах
        currency: "USD",
        paymentMethodId: paymentMethod.id, // ID платёжного метода
      });

      const { clientSecret } = paymentIntentResponse.data;

      const confirmResult = await stripe.confirmCardPayment(clientSecret);
      if (confirmResult.error) {
        errorMessage.value = confirmResult.error.message;
        return;
      }

      successMessage.value = "Разовый платёж успешно завершён!";
    } else if (paymentType.value === "subscription") {
      // Обработка подписки
      const subscriptionResponse = await api.post("/create-subscription", {
        paymentMethodId: paymentMethod.id, // ID платёжного метода
        customerName: "Test User",
        customerEmail: "test@example.com",
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

// Инициализация Stripe Elements при монтировании компонента
onMounted(async () => {
  const stripe = await stripePromise;

  if (!stripe) {
    errorMessage.value = "Ошибка инициализации Stripe.";
    return;
  }

  elements.value = stripe.elements();

  // Создаём и монтируем элементы для ввода данных карты
  cardElement.value = elements.value.create("card");
  cardElement.value.mount("#card-element");
});
</script>

<template>
  <div class="payment-form">
    <h1>Оплата</h1>
    <form @submit.prevent="handleSubmit">
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

      <!-- Кнопка для отправки формы -->
      <button :disabled="isProcessing" class="submit-button">
        {{ isProcessing ? "Обработка..." : paymentType === "one-time" ? "Оплатить" : "Оформить подписку" }}
      </button>
    </form>

    <!-- Сообщение об успешной оплате -->
    <p v-if="successMessage" class="success">{{ successMessage }}</p>
  </div>
</template>

<style scoped>
.payment-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border-radius: 8px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  font-size: 24px;
  margin-bottom: 20px;
}

.form-label {
  font-size: 14px;
  margin-bottom: 8px;
  display: block;
}

.payment-type-select {
  width: 100%;
  padding: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.stripe-element {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: white;
  margin-bottom: 16px;
}

button.submit-button {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button.submit-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error {
  color: red;
  font-size: 14px;
  margin-top: 10px;
}

.success {
  color: green;
  font-size: 14px;
  margin-top: 10px;
  text-align: center;
}
</style>
