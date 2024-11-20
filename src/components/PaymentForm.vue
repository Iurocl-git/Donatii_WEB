<script setup>
import {ref} from "vue";
import {loadStripe} from "@stripe/stripe-js";

// Подключаем публичный ключ Stripe
const stripePromise = loadStripe("your-publishable-key");

// Локальное состояние
const cardholderName = ref("");
const email = ref("");
const errorMessage = ref(null);
const isProcessing = ref(false);
const successMessage = ref(null);
const stripeError = ref(null);

const handleSubmit = async () => {
  if (!cardholderName.value || !email.value) {
    errorMessage.value = "Пожалуйста, заполните все поля.";
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errorMessage.value = "Введите корректный email.";
    return;
  }

  const stripe = await stripePromise;
  if (!stripe) {
    stripeError.value = "Ошибка инициализации Stripe.";
    return;
  }

  // Получаем элемент карты
  const cardElement = stripe.elements().getElement("card");

  if (!cardElement) {
    stripeError.value = "Элемент карты не найден.";
    return;
  }

  isProcessing.value = true;

  try {
    // Создаем платежный метод
    const {error, paymentMethod} = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
      billing_details: {
        name: cardholderName.value,
        email: email.value,
      },
    });

    if (error) {
      stripeError.value = error.message;
    } else {
      successMessage.value = `Оплата прошла успешно! PaymentMethod ID: ${paymentMethod.id}`;
      errorMessage.value = null;
    }
  } catch (err) {
    stripeError.value = "Ошибка при создании платежного метода.";
    console.error(err);
  } finally {
    isProcessing.value = false;
  }
};
</script>

<template>
  <div class="payment-form">
    <h1>Оплата картой</h1>
    <form @submit.prevent="handleSubmit">
      <label>
        Имя владельца карты:
        <input v-model="cardholderName" type="text" placeholder="Иван Иванов"/>
      </label>

      <label>
        Email:
        <input v-model="email" type="email" placeholder="example@mail.com"/>
      </label>

      <div id="card-element"></div>

      <button :disabled="isProcessing">
        {{ isProcessing ? "Обработка..." : "Оплатить" }}
      </button>
    </form>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="stripeError" class="error">{{ stripeError }}</p>
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

label {
  display: block;
  margin-bottom: 10px;
}

input {
  width: 100%;
  padding: 10px;
  margin: 5px 0 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 12px;
  background-color: #4caf50;
  color: white;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error {
  color: red;
  margin-top: 10px;
}

.success {
  color: green;
  margin-top: 10px;
}
</style>
