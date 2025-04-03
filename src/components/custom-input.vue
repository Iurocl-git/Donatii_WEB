<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  label: String,
  value: String,
  type: {
    type: String,
    default: "",
  },
  regex: {
    type: RegExp,
    required: true,
  },
});

const emit = defineEmits(["input", "valid"]);

const inputValue = ref(props.value || "");
const showError = ref(false); // Флаг отображения ошибки
const typingTimer = ref(null); // Таймер для дебаунса

const handleInput = (event) => {


  inputValue.value = event.target.value;
  const validNow = props.regex.test(inputValue.value);

  emit("valid", validNow);
  emit("input", inputValue.value);

  // Отображаем ошибку только при остановке ввода
  if (typingTimer.value) clearTimeout(typingTimer.value);

  typingTimer.value = setTimeout(() => {
    showError.value = !validNow; // Показываем ошибку через 1 секунду
  }, 1000);
};

const name = computed(() => props.label?.toLowerCase() || "");
</script>

<template>
  <label class="custom-input">
    {{ label ? label : "" }}
    <input
      type="text"
      :name="name"
      v-model="inputValue"
      @input="handleInput"
      :type="type"
      class="custom-input-field"
      :class="{ 'input-error': showError }"
    />
    <p v-if="showError" class="error-message">Неверный формат</p>
  </label>
</template>

<style scoped>
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

.custom-input-field {
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s, box-shadow 0.3s;
  background-color: #f9f9f9;
  width: 100%;
}

/* Состояние hover */
.custom-input-field:hover {
  border-color: #888;
}

/* Состояние focus */
.custom-input-field:focus {
  border-color: #43a3d9;
  box-shadow: 0 0 4px rgb(52, 127, 166);
}

/* Состояние ошибки должно быть выше по приоритету */
.custom-input-field.input-error {
  border-color: red; /* Ошибка всегда отображается */
  box-shadow: none; /* Убираем тень при ошибке */
}

/* Сообщение об ошибке */
.error-message {
  color: red;
  font-size: 12px;
}

@media (max-width: 768px) {
  .custom-input {
    align-items: center;
    text-align: center;
  }
}

</style>
