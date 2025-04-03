<script setup>
import { ref, onMounted, reactive, watch } from 'vue'
import { loadStripe } from '@stripe/stripe-js'
import api from '@/API/axios.js'
import CustomButton from '@/components/custom-button.vue'
import CustomInput from '@/components/custom-input.vue'

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

// State
const paymentType = ref('one-time') // "one-time" or "subscription"
const errorMessage = ref(null)
const isProcessing = ref(false)
const successMessage = ref(null)

// Stripe Elements
const cardElement = ref(null)
const elements = ref(null)

// Form data and validation
const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
})

const validationState = reactive({
  isEmailValid: false,
  isFirstNameValid: false,
  isLastNameValid: false,
  isPhoneValid: false,
  isCardValid: false,
  isValid: false, // Global form validity
})

const nameRegex = /^(?!\s*$)[a-zA-Z]{1,20}$/
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const phoneRegex = /^\+?[1-9]\d{1,14}$/

// Payment handler
const handleSubmit = async () => {
  errorMessage.value = null

  const stripe = await stripePromise
  if (!stripe) {
    errorMessage.value = 'Stripe initialization error.'
    return
  }

  if (!validationState.isValid) {
    errorMessage.value = 'The form contains errors.'
    return
  }

  isProcessing.value = true

  const billingDetails = {
    name: `${formData.value.firstName} ${formData.value.lastName}`,
    email: formData.value.email,
    phone: formData.value.phone,
  }

  try {
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement.value,
      billing_details: billingDetails,
    })

    if (error) {
      errorMessage.value = error.message
      return
    }

    if (paymentType.value === 'one-time') {
      const paymentIntentResponse = await api.post('/handle_payment/pay', {
        amount: 1000,
        currency: 'usd',
        paymentMethodId: paymentMethod.id,
      })

      const { clientSecret } = paymentIntentResponse.data

      const confirmResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement.value,
          billing_details: billingDetails,
        },
      })
      if (confirmResult.error) {
        errorMessage.value = confirmResult.error.message
        return
      }

      successMessage.value = 'One-time payment successfully completed!'
    } else if (paymentType.value === 'subscription') {
      const subscriptionResponse = await api.post('/handle_payment/create-subscription', {
        paymentMethodId: paymentMethod.id,
        customerName: billingDetails.name,
        customerEmail: billingDetails.email,
        customerPhone: billingDetails.phone,
        priceId: 'price_1QONFqCxCswpWX46QILwtb8W',
      })
      const { clientSecret, status } = subscriptionResponse.data

      if (status === 'requires_action') {
        const confirmResult = await stripe.confirmCardPayment(clientSecret)
        if (confirmResult.error) {
          errorMessage.value = confirmResult.error.message
          return
        }
      }

      successMessage.value = 'Subscription successfully created!'
    }
  } catch (err) {
    errorMessage.value = 'Error processing payment.'
    console.error(err)
  } finally {
    isProcessing.value = false
  }
}

// Validate card
const validateCard = async (stripe) => {
  if (!stripe) {
    errorMessage.value = 'Stripe initialization error.'
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

// Initialize Stripe Elements
onMounted(async () => {
  const stripe = await stripePromise

  if (!stripe) {
    errorMessage.value = 'Stripe initialization error.'
    return
  }

  elements.value = stripe.elements()
  cardElement.value = elements.value.create('card', {
    hidePostalCode: true,
    style: {
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
  })

  cardElement.value.on('focus', () => {
    const element = document.querySelector('#card-element')
    if (element && validationState.isCardValid) {
      element.style.borderColor = '#43a3d9'
      element.style.boxShadow = '0 0 4px rgb(52, 127, 166)'
    }
  })

  cardElement.value.on('blur', () => {
    const element = document.querySelector('#card-element')
    if (element) {
      element.style.borderColor = '#ccc'
      element.style.boxShadow = 'none'
    }
  })

  cardElement.value.on('change', async (event) => {
    await validateCard(stripe)
    const element = document.querySelector('#card-element')
    if (event.error) {
      element.style.borderColor = '#fa755a'
      element.style.boxShadow = 'none'
    } else if (!event.error && event.complete) {
      element.style.borderColor = '#43a3d9'
    } else {
      element.style.borderColor = '#ccc'
    }
  })

  cardElement.value.mount('#card-element')
})

// Automatic form validation
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
    <h1 class="form_title">Enter your details</h1>

    <!-- Form fields -->
    <custom-input
      label="Last Name"
      :regex="nameRegex"
      @valid="validationState.isLastNameValid = $event"
      @input="formData.lastName = $event"
    />
    <custom-input
      label="First Name"
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
      label="Phone"
      :regex="phoneRegex"
      @valid="validationState.isPhoneValid = $event"
      @input="formData.phone = $event"
    />

    <label class="custom-input" for="payment-type">
      Payment Type:
      <select v-model="paymentType" id="payment-type" class="custom-dropdown">
        <option value="one-time">One-time Payment</option>
        <option value="subscription">Subscription (monthly)</option>
      </select>
    </label>

    <div class="custom-input">
      <label for="card-element">Card Details:</label>
      <div id="card-element" class="custom-card-input"></div>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <custom-button
      :label="isProcessing ? 'Processing...' : paymentType === 'one-time' ? 'Pay Now' : 'Subscribe'"
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
