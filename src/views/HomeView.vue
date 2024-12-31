<script setup>
import AboutUs from '@/components/AboutUs.vue'
import LoginForm from '@/components/LoginForm.vue'
import PaymentForm from '@/components/PaymentForm.vue'
import CaptchaGoogle from '@/components/Captcha-google.vue'
</script>

<template>
  <main class="home-view col-12">
    <div class="label">
      <p>Raspandeste iubirea prin net! Salveaza viata!</p>
    </div>
    <AboutUs class="about_us col-8" />

    <PaymentForm class="pay_form" />
    <Captcha-google siteKey="6Le4FIgqAAAAAJXYt4ngDOewOR1lERp9FV4uewVt" />

    <!--    <LoginForm class="login_form"/>-->
  </main>
</template>

<style scoped>
.label {
  text-align: center;
  margin-top: 100px;
  margin-bottom: 60px;
}
.label p {
  text-align: center;
  font-size: 30px;
}
.about_us {
  margin-left: auto;
  margin-right: auto;
}
.pay_form {
  //margin-left: auto;
  //margin-right: auto;
  margin: 80px auto 0 auto;
}
</style>
