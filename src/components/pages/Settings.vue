<template>
  <div class="settings page">
    <div class="settings-form">
      <form class="settings-header" @submit.prevent>
        <h2>
          {{ $t('main.studio') }}
        </h2>
        <div class="field">
          <label class="label">
            {{ $t('settings.logo') }}
          </label>
          <div class="logo-wrapper" v-if="form.has_avatar">
            <img :src="organisationLogoPath" />
          </div>
          <p class="no-logo" v-else>
            <em>{{ $t('settings.no_logo') }}</em>
          </p>
          <p>
            <button
              type="button"
              class="button set-logo-button"
              @click="showAvatarModal"
            >
              {{ $t('settings.set_logo') }}
            </button>
          </p>
          <p v-if="form.has_avatar">
            <button
              type="button"
              class="button is-link remove-logo-button"
              @click="removeAvatar"
            >
              {{ $t('settings.remove_logo') }}
            </button>
          </p>
        </div>
      </form>
      <form ref="form" @submit.prevent="saveSettings">
        <h2>
          {{ $t('settings.title') }}
        </h2>
        <text-field
          class="mt2"
          :label="$t('settings.fields.name')"
          :required="true"
          v-model.trim="form.name"
        />
        <text-field
          :label="$t('settings.fields.hours_by_day')"
          :min="1"
          :max="24"
          :required="true"
          type="number"
          v-model="form.hours_by_day"
        />
        <combobox-boolean
          :label="$t('settings.fields.use_original_name')"
          v-model="form.use_original_file_name"
        />
        <combobox-boolean
          :label="$t('settings.fields.show_hd_default')"
          v-model="form.hd_by_default"
        />
        <combobox-boolean
          :label="$t('settings.fields.timesheets_locked')"
          v-model="form.timesheets_locked"
        />
        <combobox-boolean
          :label="$t('settings.fields.format_duration_in_hours')"
          v-model="form.format_duration_in_hours"
        />
        <combobox-boolean
          :label="$t('settings.fields.dark_theme_by_default')"
          v-model="form.dark_theme_by_default"
        />
        <h2>
          {{ $t('settings.integrations') }}
        </h2>
        <text-field
          :label="$t('settings.fields.slack_token')"
          v-model.trim="form.chat_token_slack"
        />
        <text-field
          :label="$t('settings.fields.discord_token')"
          v-model.trim="form.chat_token_discord"
        />
        <div class="mattermost_integrations">
          <text-field
            :label="$t('settings.fields.mattermost_webhook')"
            v-model.trim="form.chat_webhook_mattermost"
          />
          <div
            class="error has-text-centered"
            v-if="errors.webhook_error === true"
          >
            <em>{{ $t('settings.webhook_error') }}</em>
          </div>
        </div>
        <button
          class="button save-button is-medium"
          :class="{
            'is-loading': loading.save
          }"
          :disabled="loading.save || !$refs.form?.checkValidity()"
        >
          {{ $t('settings.save.button') }}
        </button>
        <p class="error has-text-centered mt2" v-if="errors.save">
          <em>{{ $t('settings.save.error') }}</em>
        </p>
      </form>
    </div>

    <change-avatar-modal
      :active="modals.avatar"
      :is-loading="loading.saveAvatar"
      :is-error="errors.saveAvatar"
      :title="$t('settings.change_logo')"
      @confirm="uploadAvatarFile"
      @cancel="hideAvatarModal"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

import ChangeAvatarModal from '@/components/modals/ChangeAvatarModal.vue'
import ComboboxBoolean from '@/components/widgets/ComboboxBoolean.vue'
import TextField from '@/components/widgets/TextField.vue'

export default {
  name: 'settings',

  components: {
    ChangeAvatarModal,
    ComboboxBoolean,
    TextField
  },

  data() {
    return {
      organisationLogoPath: '',
      form: {
        chat_token_discord: '',
        chat_token_slack: '',
        chat_webhook_mattermost: '',
        has_avatar: false,
        hd_by_default: 'false',
        hours_by_day: 0,
        name: '',
        timesheets_locked: 'false',
        use_original_file_name: 'false',
        format_duration_in_hours: 'true',
        dark_theme_by_default: 'false'
      },
      errors: {
        save: false,
        saveAvatar: false,
        webhook_error: false
      },
      loading: {
        save: false,
        saveAvatar: false
      },
      modals: {
        avatar: false
      }
    }
  },

  mounted() {
    this.organisationLogoPath = `/api/pictures/thumbnails/organisations/${this.organisation.id}.png`
  },

  computed: {
    ...mapGetters(['organisation'])
  },

  methods: {
    ...mapActions([
      'changeAvatar',
      'deleteOrganisationLogo',
      'saveOrganisation',
      'uploadOrganisationLogo'
    ]),

    checkWebhook() {
      if (
        !this.form.chat_webhook_mattermost ||
        this.form.chat_webhook_mattermost.match('/hooks/[a-zA-Z0-9]+$')
      ) {
        this.errors.webhook_error = false
        return true
      } else {
        this.errors.webhook_error = true
        return false
      }
    },

    hideAvatarModal() {
      this.modals.avatar = false
    },

    showAvatarModal() {
      this.modals.avatar = true
    },

    saveSettings() {
      if (this.checkWebhook()) {
        this.loading.save = true
        this.errors.save = false
        const organisation = {
          ...this.form,
          hd_by_default: this.form.hd_by_default === 'true',
          timesheets_locked: this.form.timesheets_locked === 'true',
          use_original_file_name: this.form.use_original_file_name === 'true',
          format_duration_in_hours:
            this.form.format_duration_in_hours === 'true',
          dark_theme_by_default: this.form.dark_theme_by_default === 'true'
        }
        this.saveOrganisation(organisation)
          .catch(err => {
            console.error(err)
            this.errors.save = true
          })
          .finally(() => {
            this.loading.save = false
          })
      }
    },

    uploadAvatarFile(formData) {
      this.loading.saveAvatar = true
      this.errors.saveAvatar = false
      this.uploadOrganisationLogo(formData)
        .then(() => {
          setTimeout(() => {
            this.modals.avatar = false
            const timestamp = Date.now()
            this.organisationLogoPath = `/api/pictures/thumbnails/organisations/${this.organisation.id}.png?t=${timestamp}`
          }, 500)
        })
        .catch(err => {
          console.error(err)
          this.errors.saveAvatar = true
        })
        .finally(() => {
          this.loading.saveAvatar = false
        })
    },

    removeAvatar() {
      this.loading.save = true
      this.errors.save = false
      this.deleteOrganisationLogo()
        .catch(err => {
          console.error(err)
          this.errors.save = true
        })
        .finally(() => {
          this.loading.save = false
        })
    }
  },

  watch: {
    organisation: {
      immediate: true,
      handler() {
        this.form = {
          chat_token_discord: this.organisation.chat_token_discord,
          chat_token_slack: this.organisation.chat_token_slack,
          chat_webhook_mattermost: this.organisation.chat_webhook_mattermost,
          has_avatar: this.organisation.has_avatar,
          hd_by_default: this.organisation.hd_by_default ? 'true' : 'false',
          hours_by_day: this.organisation.hours_by_day,
          name: this.organisation.name,
          timesheets_locked: this.organisation.timesheets_locked
            ? 'true'
            : 'false',
          use_original_file_name: this.organisation.use_original_file_name
            ? 'true'
            : 'false',
          format_duration_in_hours: this.organisation.format_duration_in_hours
            ? 'true'
            : 'false',
          dark_theme_by_default: this.organisation.dark_theme_by_default
            ? 'true'
            : 'false'
        }
      }
    }
  },

  head() {
    return {
      title: `${this.$t('settings.title')} - Kitsu`
    }
  }
}
</script>

<style lang="scss" scoped>
.dark {
  .settings {
    background: $dark-grey-2;
    color: $white-grey;
  }

  .settings-form {
    background: $dark-grey-lighter;
    color: $white-grey;
  }

  .set-logo-button {
    background-color: $grey;
    color: $dark-grey;
  }
}

.mattermost_integrations {
  margin-bottom: 4em;
  .field {
    margin-bottom: 0;
  }
}

.settings {
  background: $white-grey;
  height: 100%;
}

.settings-form {
  background: white;
  max-width: 500px;
  margin: auto;
  margin-top: 2em;
  margin-bottom: 2em;
  padding: 2em;
  box-shadow: rgba(0, 0, 0, 0.15) 0 1px 4px 2px;
  border-radius: 1em;
}

input,
select,
span.select {
  width: 100%;
}

h2:first-child {
  margin-top: 0;
}

.save-button {
  background: $green;
  border-radius: 10px;
  border-color: $green;
  color: white;
  width: 100%;
}

.save-button:hover {
  background: $light-green;
  border-color: $light-green;
}

.logo-wrapper {
  padding: 0;

  img {
    width: 100px;
  }
}

.no-logo {
  margin-bottom: 1em;
}

.remove-logo-button {
  margin-top: 0.5rem;
  font-size: 0.7em;
}
</style>
