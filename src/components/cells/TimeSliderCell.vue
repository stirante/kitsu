<template>
  <td>
    <div class="flexrow">
      <span class="value flexrow-item">
        {{ formattedDisplayValue }}
      </span>
      <vue-slider
        class="flexrow-item slider"
        :dot-options="{ focusStyle: { 'box-shadow': '0 0 1px 1px #8F91EBA0' } }"
        :interval="0.25"
        :lazy="true"
        :min="0"
        :max="12"
        :marks="marks"
        :piecewise="true"
        :process-style="{ 'background-color': '#8F91EB' }"
        :tooltip="'hover'"
        :use-keyboard="true"
        :step-style="stepStyle"
        :width="400"
        v-model="value"
      />
      <button-simple
        v-if="showTimerControls"
        class="flexrow-item icon-button timer-button"
        :title="$t(isTimerRunning ? 'timers.stop' : 'timers.start')"
        :icon="isTimerRunning ? 'stop' : 'play'"
        @click="toggleTimer"
      />
      <button class="button flexrow-item" @click="setValue(1)">1</button>
      <button class="button flexrow-item" @click="setValue(4)">4</button>
      <button class="button flexrow-item" @click="setValue(hoursByDay)">
        {{ hoursByDay }}
      </button>
    </div>
  </td>
</template>

<script>
import { mapGetters } from 'vuex'
import VueSlider from 'vue-3-slider-component'
import ButtonSimple from '@/components/widgets/ButtonSimple.vue'

export default {
  name: 'time-slider-cell',

  data() {
    return {
      value: this.duration,
      marks: {
        0: {
          label: '0',
          labelStyle: { fontSize: '.6em', top: '3px', left: '1px' }
        },
        2: { label: '' },
        4: {
          label: '4',
          labelStyle: { fontSize: '.6em', top: '3px', left: '1px' }
        },
        6: { label: '' },
        8: {
          label: '8',
          labelStyle: { fontSize: '.6em', top: '3px', left: '1px' }
        },
        10: { label: '' },
        12: {
          label: '12',
          labelStyle: { fontSize: '.6em', top: '3px', left: '1px' }
        }
      }
    }
  },

  components: {
    ButtonSimple,
    VueSlider
  },

  props: {
    taskId: {
      type: String,
      default: ''
    },
    duration: {
      type: Number,
      default: 0
    },
    displayDuration: {
      type: Number,
      default: null
    },
    isTimerRunning: {
      type: Boolean,
      default: false
    },
    showTimerControls: {
      type: Boolean,
      default: false
    }
  },

  emits: {
    change: null,
    'start-timer': null,
    'stop-timer': null
  },

  computed: {
    ...mapGetters(['organisation']),

    hoursByDay() {
      return this.organisation.hours_by_day || 8
    },

    displayValue() {
      const displayed = this.displayDuration ?? this.value
      return Math.round((displayed + Number.EPSILON) * 100) / 100
    },

    formattedDisplayValue() {
      if (Number.isInteger(this.displayValue)) {
        return `${this.displayValue}`
      }

      return this.displayValue.toFixed(2).replace(/\.?0+$/, '')
    },

    stepStyle() {
      return {
        display: 'block',
        borderRadius: 0,
        height: '10px',
        width: '4px',
        top: '-1px',
        backgroundColor: 'gray'
      }
    }
  },

  methods: {
    setValue(value) {
      this.value = value || 0
    },

    toggleTimer() {
      if (this.isTimerRunning) {
        this.$emit('stop-timer')
      } else {
        this.$emit('start-timer')
      }
    }
  },

  watch: {
    duration(newValue) {
      this.value = newValue
    },

    value() {
      if (this.value === this.duration) {
        return
      }

      this.$emit('change', {
        taskId: this.taskId,
        duration: this.value
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.value {
  font-size: 1.5em;
  font-weight: bold;
  width: 40px;
}

.slider {
  cursor: pointer;
}

.timer-button {
  margin-left: 0.5rem;
}
</style>
