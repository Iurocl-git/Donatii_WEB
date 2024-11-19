<script setup>
const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: "button", // Тип кнопки (button, submit, reset)
  },
  disabled: {
    type: Boolean,
    default: false, // Если true, кнопка неактивна
  },
  variant: {
    type: String,
    default: "primary", // Варианты: primary, secondary, danger
  },
});
</script>

<template>
  <button
    :class="['custom-button', variant, { disabled }]"
    :type="type"
    :disabled="disabled"
  >
    {{ label }}
  </button>
</template>

<style scoped>
/* Базовый стиль кнопки */
.custom-button {
  display: inline-block;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  background-color: #4caf50; /* Зеленый (по умолчанию) */
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  text-transform: uppercase;
}

/* Ховер эффект */
.custom-button:hover {
  background-color: #45a049;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
}

/* Активное состояние */
.custom-button:active {
  background-color: #3e8e41;
  transform: scale(0.98);
}

/* Заблокированная кнопка */
.custom-button.disabled {
  background-color: #ccc;
  cursor: not-allowed;
  color: #666;
  box-shadow: none;
}

/* Варианты кнопок */
.custom-button.primary {
  background-color: #4caf50;
}

.custom-button.secondary {
  background-color: #2196f3;
}

.custom-button.secondary:hover {
  background-color: #1e88e5;
}

.custom-button.danger {
  background-color: #f44336;
}

.custom-button.danger:hover {
  background-color: #e53935;
}
</style>
