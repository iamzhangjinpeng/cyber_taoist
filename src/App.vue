<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN">
    <NMessageProvider>
      <HelloWorld />
    </NMessageProvider>
  </n-config-provider>
</template>

<script setup>
import { NMessageProvider, NConfigProvider, zhCN, dateZhCN } from 'naive-ui';
import HelloWorld from './components/HelloWorld.vue'
</script>

<style scoped></style>
