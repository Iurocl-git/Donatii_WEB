<template>
  <div>
    <button @click="executeCaptcha">Submit</button>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

const siteKey = '6Le4FIgqAAAAAJXYt4ngDOewOR1lERp9FV4uewVt' // Replace with your reCAPTCHA v3 site key

const loadRecaptchaScript = () => {
  if (!document.getElementById('recaptcha-script')) {
    const script = document.createElement('script')
    script.id = 'recaptcha-script'
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }
}

const executeCaptcha = () => {
  if (typeof window.grecaptcha !== 'undefined') {
    window.grecaptcha
      .execute(siteKey, { action: 'submit' })
      .then((token) => {
        console.log('Captcha token:', token)
      })
      .catch((error) => {
        console.error('Error executing reCAPTCHA:', error)
      })
  } else {
    console.error('grecaptcha is not loaded yet.')
  }
}

onMounted(() => {
  loadRecaptchaScript()
})
</script>
