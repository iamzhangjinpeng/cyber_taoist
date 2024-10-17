<template>
  <div class="container">
    <div class="header">
      <h2>小六壬</h2>
    </div>
    <div class="box-container">
      <template v-for="x in 6" :key="x">
        <template v-for="y in 5" :key="`${x}_${y}`">
          <div :class="`box ${getColor(x, y) ? 'show' : ''}`">
            <n-button v-if="dictionary[`${x}_${y}`]" :type="dictionary[`${x}_${y}`].color"
              :dashed="dictionary[`${x}_${y}`].key === words[current].key">{{ dictionary[`${x}_${y}`].key
              }}
            </n-button>
          </div>
        </template>
      </template>
    </div>
    <div class="form">
      <n-form ref="formRef" :label-width="80" :model="formValue" :rules="rules">
        <n-grid :cols="24" :x-gap="4">
          <n-form-item-gi :span="8" label="数字 1" path="num1">
            <n-input-number v-model:value="formValue.num1" placeholder=" " :min="0" />
          </n-form-item-gi>
          <n-form-item-gi :span="8" label="数字 2" path="num2">
            <n-input-number v-model:value="formValue.num2" placeholder=" " :min="0" />
          </n-form-item-gi>
          <n-form-item-gi :span="8" label="数字 3" path="num3">
            <n-input-number v-model:value="formValue.num3" placeholder=" " :min="0" />
          </n-form-item-gi>
        </n-grid>
        <n-grid :cols="24" :x-gap="4">
          <n-grid-item v-for="index, i in result" :key="i" :span="8" style="text-align: center;">
            <n-button :type="words[index].color" dashed>{{ words[index].key }}</n-button>
          </n-grid-item>
        </n-grid>

        <n-form-item>
          <n-space>
            <n-button type="success" @click="submit">
              起卦！落子无悔！
            </n-button>
            <n-button @click="reset">
              大侠重新来过
            </n-button>
          </n-space>
        </n-form-item>
      </n-form>
    </div>
  </div>
</template>

<script setup>
import { NTag, NForm, NFormItem, NInputNumber, NButton, useMessage, NGrid, NGridItem, NFormItemGi, NSpace } from 'naive-ui'
import { computed, ref } from 'vue';

const message = useMessage()

const palm = {
  palm: [4, 2, 6, 5],
  one: [3, 1, 5, 1],
  two: [1, 2, 3, 2],
  three: [1, 3, 3, 3],
  four: [1, 4, 3, 4],
  five: [1, 5, 3, 5]
}

const words = [
  {
    key: '大安',
    position: [3, 2],
    color: 'success'
  }, {
    key: '留连',
    position: [1, 2],
    color: 'error'
  }, {
    key: '速喜',
    position: [1, 3],
    color: 'success',
  }, {
    key: '赤口',
    position: [1, 4],
    color: 'error'
  }, {
    key: '小吉',
    position: [3, 4],
    color: 'success'
  }, {
    key: '空亡',
    position: [3, 3],
    color: 'error'
  }
]

const dictionary = computed(() => {
  const dict = {}
  for (const { key, color, position: [x, y] } of words) {
    dict[`${x}_${y}`] = {
      key,
      color
    }
  }
  return dict
})

const getColor = (x, y) => {
  for (const [x1, y1, x2, y2] of Object.values(palm)) {
    if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
      return true
    }
  }
  return false
}

const formRef = ref(null)
const formValue = ref({
  num1: null,
  num2: null,
  num3: null,
})


const validateNumber = (_, value) => {
  if (!Number.isInteger(value)) {
    return new Error('输入不是数字，你不心诚，道爷叫闪电⚡️劈你!!!')
  }
  if (value < 0 || value > 1000) {
    return new Error('数字不符合要求，道爷算不过来，叫闪电⚡️劈你!!!')
  }
  return true
}

const rules = {
  num1: {
    required: true,
    trigger: ['input', 'blur'],
    validator: validateNumber
  },
  num2: {
    required: true,
    trigger: ['input', 'blur'],
    validator: validateNumber
  },
  num3: {
    required: true,
    trigger: ['input', 'blur'],
    validator: validateNumber
  }
}

const result = ref([])
const current = ref(0)
const start = async () => {
  result.value = []
  current.value = 0
  const {
    num1,
    num2,
    num3
  } = formValue.value
  for (let num of [num1, num2, num3]) {
    while (num > 1) {
      await new Promise((resolve) => {
        setTimeout(() => {
          current.value = (current.value + 1) % words.length
          num--
          resolve()
        }, 200)
      })
    }
    result.value.push(current.value)
  }
  current.value = 0
}

const submit = (e) => {
  e.preventDefault();
  formRef.value?.validate((errors) => {
    if (!errors) {
      start()
    } else {
      console.log(errors);
      message.error(errors[0][0].message);
    }
  });
}

const reset = () => {
  result.value = []
  current.value = 0
  formValue.value = {
    num1: null,
    num2: null,
    num3: null
  }
}

</script>

<style scoped>
.header {
  text-align: center;
}

.container {
  max-width: 600px;
  margin: auto;
  background-color: #fff;
  padding: 20px;

  .box-container {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(7, 1fr);

    .box {
      height: 60px;
      border: 1px solid black;
      text-align: center;
      line-height: 60px;
    }

    .show {
      background-color: antiquewhite;
    }
  }
}
</style>
