<script setup>
import { ref, onMounted, reactive, watch } from 'vue'
import { loadStripe } from '@stripe/stripe-js'
import api from '@/API/axios.js'
import CustomButton from '@/components/custom-button.vue'
import CustomInput from '@/components/custom-input.vue'

// Инициализация Stripe
const stripePromise = loadStripe(
  'pk_test_51QNEJ0CxCswpWX46PKgphGAEgQIrNafMF2bIfEMZIqc9C1Ih5IOmRg9EdM50zXXGZIdzi34rvHo7JkVRkWI7RvwG00fyY0Byfn',
) // Вставьте ваш публичный ключ Stripe

// Состояние
const paymentType = ref('one-time') // "one-time" или "subscription"
const errorMessage = ref(null)
const isProcessing = ref(false)
const successMessage = ref(null)

// Ссылки на Stripe Elements
const cardElement = ref(null)
const elements = ref(null)

// Данные формы и их валидация
const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
})
// const stripe = computed(async () => {
//   return await stripePromise;
// })
const validationState = reactive({
  isEmailValid: false,
  isFirstNameValid: false,
  isLastNameValid: false,
  isPhoneValid: false,
  isCardValid: false,
  isValid: false, // Глобальный флаг валидности всей формы
})

const nameRegex = /^(?!\s*$)[a-zA-Zа-яА-ЯёЁ]{1,20}$/
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const phoneRegex = /^\+?[1-9]\d{0,2}[-\s]?(\(\d{1,4}\)[-\s]?)?\d{1,10}([-\\s]?\d{1,10}){0,4}$/

// Функция для обработки платежа
const handleSubmit = async () => {
  errorMessage.value = null

  const stripe = await stripePromise
  if (!stripe) {
    errorMessage.value = 'Ошибка инициализации Stripe.'
    return
  }

  if (!validationState.isValid) {
    errorMessage.value = 'Форма содержит ошибки.'
    return
  }

  isProcessing.value = true

  try {
    // Создаём Payment Method через Stripe Elements
    // console.log("start method");

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement.value,
      billing_details: {
        name: `${formData.value.firstName} ${formData.value.lastName}`,
        email: formData.value.email,
        phone: formData.value.phone,
      },
    })

    if (error) {
      // console.log("error");
      errorMessage.value = error.message
      return
    }

    const billingDetails = {
      name: `${formData.value.firstName} ${formData.value.lastName}`,
      email: formData.value.email,
      phone: formData.value.phone,
    }

    if (paymentType.value === 'one-time') {
      // Разовый платёж
      const paymentIntentResponse = await api.post('/handle_payment/pay', {
        amount: 1000,
        currency: 'usd',
        paymentMethodId: paymentMethod.id,
        // payment_method_types: ["card"],
      })

      const { clientSecret } = paymentIntentResponse.data

      // console.log(paymentIntentResponse);
      const confirmResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement.value, // Ваш Stripe Element
          billing_details: billingDetails,
        },
      })
      if (confirmResult.error) {
        // console.log("error confirm");
        errorMessage.value = confirmResult.error.message
        return
      }

      successMessage.value = 'Разовый платёж успешно завершён!'
    } else if (paymentType.value === 'subscription') {
      // Подписка
      const subscriptionResponse = await api.post('/handle_payment/create-subscription', {
        paymentMethodId: paymentMethod.id,
        customerName: billingDetails.name,
        customerEmail: billingDetails.email,
        customerPhone: billingDetails.phone,
        priceId: 'price_1QONFqCxCswpWX46QILwtb8W', // Замените на ID вашего плана из Stripe Dashboard
      })
      // console.log("subscriptionResponse.data");
      const { clientSecret, status } = subscriptionResponse.data

      if (status === 'requires_action') {
        // console.log("requires_action");

        const confirmResult = await stripe.confirmCardPayment(clientSecret)
        if (confirmResult.error) {
          errorMessage.value = confirmResult.error.message
          return
        }
      }

      successMessage.value = 'Подписка успешно оформлена!'
    }
  } catch (err) {
    errorMessage.value = 'Ошибка при обработке платежа.'
    console.error(err)
  } finally {
    isProcessing.value = false
  }
}

const validateCard = async (stripe) => {
  // const stripe = await stripePromise;
  if (!stripe) {
    errorMessage.value = 'Ошибка инициализации Stripe.'
    validationState.isCardValid = false
    return
  }

  const { error } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardElement.value,
  })
  validationState.isCardValid = !error

  return !error
}

// Инициализация Stripe Elements
onMounted(async () => {
  const stripe = await stripePromise

  if (!stripe) {
    errorMessage.value = 'Ошибка инициализации Stripe.'
    return
  }

  elements.value = stripe.elements()
  cardElement.value = elements.value.create('card', {
    hidePostalCode: true,
    style: {
      invalid: {
        color: '#fa755a', // Цвет текста при ошибке
        iconColor: '#fa755a', // Цвет иконки при ошибке
      },
    },
  })
  cardElement.value.on('focus', () => {
    const element = document.querySelector('#card-element')
    if (element && validationState.isCardValid) {
      element.style.borderColor = '#43a3d9' // Цвет рамки при фокусе
      element.style.boxShadow = '0 0 4px rgb(52, 127, 166)' // Тень при фокусе
    }
  })

  cardElement.value.on('blur', () => {
    const element = document.querySelector('#card-element')
    if (element) {
      element.style.borderColor = '#ccc' // Возвращаем стандартный цвет
      element.style.boxShadow = 'none' // Убираем тень
    }
  })
  cardElement.value.on('change', async (event) => {
    await validateCard(stripe) // Проверяем карту при изменении
    const element = document.querySelector('#card-element')
    if (event.error) {
      element.style.borderColor = '#fa755a' // Цвет рамки при ошибке
      element.style.boxShadow = 'none'
    } else if (!event.error && event.complete) {
      element.style.borderColor = '#43a3d9' // Цвет рамки при успешном вводе
    } else {
      element.style.borderColor = '#ccc' // Стандартный цвет рамки
    }
  })

  cardElement.value.mount('#card-element')
})

// Автоматическая проверка валидности формы
watch(
  () => ({
    isEmailValid: validationState.isEmailValid,
    isFirstNameValid: validationState.isFirstNameValid,
    isLastNameValid: validationState.isLastNameValid,
    isPhoneValid: validationState.isPhoneValid,
    isCardValid: validationState.isCardValid,
  }),
  (newState) => {
    validationState.isValid =
      newState.isEmailValid &&
      newState.isFirstNameValid &&
      newState.isLastNameValid &&
      newState.isPhoneValid &&
      newState.isCardValid
  },
  { immediate: true },
)
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
      <label for="card-element"> Данные карты: </label>
      <div id="card-element" class="custom-card-input"></div>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <!--    </div>-->

    <!-- Кнопка отправки -->
    <custom-button
      :label="
        isProcessing
          ? 'Обработка...'
          : paymentType === 'one-time'
            ? 'Оплатить'
            : 'Оформить подписку'
      "
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
  //margin: 0 auto;
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
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
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
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
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

/* Адаптивность */
@media (max-width: 768px) {
  .custom-input {
    align-items: center;
    text-align: center;
  }
}
</style>
