<script setup>
import {reactive, ref, watch} from "vue";
import CustomInput from "@/components/custom-input.vue";
import CustomButton from "@/components/custom-button.vue";
const formData = ref({
  firstName: "",
  lastName: "",
  email: "",
  phone: ""
});

const isValid = ref(false);
const validationState = reactive({
  isEmailValid: false,
  isFirstNameValid: false,
  isLastNameValid: false,
  isPhoneValid: false,
  isValid: false, // Глобальный флаг валидности всей формы
});

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const nameRegex = /^(?!\s*$)[a-zA-Zа-яА-ЯёЁ]{1,20}$/;
const phoneRegex = /^\+?[1-9]\d{0,2}[-\s]?(\(\d{1,4}\)[-\s]?)?\d{1,10}([-\\s]?\d{1,10}){0,4}$/;

const validateForm = async () => {
  if (!isValid.value) {
    console.log("Форма содержит ошибки.");
    return;
  }

  // Отправка данных через fetch/axios
  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData.value),
    });

    if (!response.ok) {
      console.error("Ошибка отправки формы:", response.statusText);
    } else {
      console.log("Данные успешно отправлены!");
    }
  } catch (error) {
    console.error("Ошибка при отправке:", error);
  }
};

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
  { immediate: true } // Убедимся, что проверка выполняется сразу
);
</script>

<template>
<!--  <section class="login_container col-4">-->
    <form class="login_container col-5" id="login" @submit.prevent="validateForm">
      <h1 class="login_title">Intoduceti datele dumneavoastra</h1>
      <custom-input label="Nume" value=""
                    :regex="nameRegex"
                    type="lastname"
                    @valid="validationState.isLastNameValid = $event"
                    @input="formData.lastName = $event"
      />
      <custom-input label="Prenume" value=""
                    :regex="nameRegex"
                    type="firstname"
                    @valid="validationState.isFirstNameValid = $event"
                    @input="formData.firstName = $event"
      />
      <custom-input label="Email" value=""
                    :regex="emailRegex"
                    type="email"
                    @valid="validationState.isEmailValid = $event"
                    @input="formData.email = $event"
      />
      <custom-input label="Numarul de telefon" value=""
                    type="phone"
                    :regex="phoneRegex"
                    @valid="validationState.isPhoneValid = $event"
                    @input="formData.phone = $event"
      />
      <custom-button label="Submit"
                     variant="primary"
                     type="submit"
                     :disabled="!isValid"
      />

<!--      <input type="submit" value="Login" @click.stop.prevent="() => validateForm(formData)">-->
    </form>
<!--  </section>-->
</template>

<style scoped>
.login_container {
  display: flex; /* Включаем Flexbox */
  flex-direction: column; /* Располагаем элементы в колонку */
  align-items: center; /* Горизонтальное центрирование */
  justify-content: center; /* Вертикальное центрирование */
  max-width: 600px;
  margin: 0 auto; /* Центрируем форму по горизонтали */
  background-color: navajowhite;
  padding: 20px 30px;
  color: #333;
  border-radius: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
  font-size: large;
}

.login_title {
  font-size: 30px;
  margin-bottom: 20px; /* Отступ снизу для заголовка */
  text-align: center; /* Центрируем текст заголовка */
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
