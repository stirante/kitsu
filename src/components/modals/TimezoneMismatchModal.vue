<template>
  <div
    :class="{
      modal: true,
      'is-active': active
    }"
  >
    <div class="modal-background" @click="$emit('cancel')"></div>
    <div class="modal-content">
      <div class="box">
        <h1 class="title">{{ $t('timezone.mismatch_title') }}</h1>
        <p class="text">
          {{
            $t('timezone.mismatch_text', {
              profile: profileTimezone,
              browser: browserTimezone
            })
          }}
        </p>
        <label class="checkbox dont-ask">
          <input type="checkbox" v-model="dontAskAgain" />
          {{ $t('timezone.dont_ask_again') }}
        </label>
        <p class="has-text-right">
          <a
            :class="{
              button: true,
              'is-primary': true,
              'is-loading': isLoading
            }"
            @click="$emit('confirm', { dontAskAgain })"
          >
            {{ $t('timezone.update', { browser: browserTimezone }) }}
          </a>
          <button
            class="button is-link"
            @click="$emit('cancel', { dontAskAgain })"
          >
            {{ $t('timezone.keep', { profile: profileTimezone }) }}
          </button>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { modalMixin } from '@/components/modals/base_modal'

export default {
  name: 'timezone-mismatch-modal',

  mixins: [modalMixin],

  props: {
    active: {
      default: false,
      type: Boolean
    },
    isLoading: {
      default: false,
      type: Boolean
    },
    profileTimezone: {
      required: true,
      type: String
    },
    browserTimezone: {
      required: true,
      type: String
    }
  },

  emits: ['cancel', 'confirm'],

  data() {
    return {
      dontAskAgain: false
    }
  }
}
</script>

<style lang="scss" scoped>
.modal-content .box {
  padding: 2em;
}
.modal-content .box p.text {
  margin-bottom: 1em;
}
.dont-ask {
  display: block;
  margin-bottom: 1.5em;
}
</style>
