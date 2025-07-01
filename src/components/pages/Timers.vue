<template>
  <div class="columns fixed-page">
    <div class="column main-column">
      <div class="timers page">
        <div class="page-header flexrow">
          <page-title class="flexrow-item title" :text="$t('timers.title')" />
          <combobox
            class="flexrow-item"
            :options="taskOptions"
            v-model="selectedTask"
            :label="$t('main.production')"
            :placeholder="$t('timers.task')"
          />
          <button-simple
            class="flexrow-item icon-button start-button"
            :title="$t('timers.start')"
            icon="play"
            @click="onStartTimer"
          />
          <div class="filler"></div>
          <date-field :can-delete="false" :label="$t('timers.date')" />
        </div>
        <div class="has-text-centered" v-if="isLoading">
          <spinner />
        </div>
        <div v-else>
          <table class="datatable" v-if="timers.length">
            <thead class="datatable-head">
              <tr class="datatable-row-header">
                <th>{{ $t('timers.task') }}</th>
                <th>{{ $t('timers.project') }}</th>
                <th>{{ $t('timers.start_time') }}</th>
                <th>{{ $t('timers.end_time') }}</th>
                <th>{{ $t('timers.duration') }}</th>
                <th>{{ $t('timers.estimated') }}</th>
                <th class="end-cell"></th>
              </tr>
            </thead>
            <tbody class="datatable-body">
              <tr class="datatable-row" v-for="timer in timers" :key="timer.id">
                <td>{{ taskName(timer.task_id) }}</td>
                <td>{{ taskById(timer.task_id).project_name }}</td>
                <td>
                  <div class="date-picker-wrapper">
                    <date-field
                      :format="'HH:mm'"
                      :can-delete="false"
                      style="margin-bottom: 0"
                      :enable-time-picker="true"
                      v-model="timerStart[timer.id]"
                      @update:model-value="updateStart(timer)"
                    />
                  </div>
                </td>
                <td>
                  <template
                    v-if="!currentTimer || currentTimer.id !== timer.id"
                  >
                    <div class="date-picker-wrapper">
                      <date-field
                        :format="'HH:mm'"
                        :can-delete="false"
                        style="margin-bottom: 0"
                        :enable-time-picker="true"
                        v-model="timerEnd[timer.id]"
                        @update:model-value="updateEnd(timer)"
                      />
                    </div>
                  </template>
                </td>
                <td>
                  {{ formatDuration(timerDuration(timer)) }}
                </td>
                <td>
                  {{ formatDuration(taskById(timer.task_id).task_duration) }}/{{
                    formatDuration(taskById(timer.task_id).task_estimation)
                  }}
                </td>
                <td class="end-cell" style="text-align: right">
                  <template v-if="currentTimer && currentTimer.id === timer.id">
                    <button-simple
                      class="icon-button"
                      :title="$t('timers.stop')"
                      icon="stop"
                      @click="onEndTimer"
                    />
                  </template>
                  <template v-else>
                    <button-simple
                      class="icon-button discard-button"
                      icon="trash"
                      @click="onDelete(timer)"
                    />
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else>{{ $t('timers.no_timer') }}</div>
        </div>
        <div class="page-footer flexrow">
          <div class="filler"></div>
          <span class="logged-time flexrow-item">
            {{ $t('timers.running_today') }}:
          </span>
          <span class="logged-time flexrow-item">
            {{ formatDuration(totalDuration) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment-timezone'
import { mapGetters, mapActions } from 'vuex'

import { formatListMixin } from '@/components/mixins/format'
import Combobox from '@/components/widgets/Combobox.vue'
import PageTitle from '@/components/widgets/PageTitle.vue'
import ButtonSimple from '@/components/widgets/ButtonSimple.vue'
import Spinner from '@/components/widgets/Spinner.vue'
import DateField from '@/components/widgets/DateField.vue'

export default {
  name: 'timers',

  mixins: [formatListMixin],

  components: {
    Combobox,
    PageTitle,
    ButtonSimple,
    Spinner,
    DateField
  },

  data() {
    return {
      timers: [],
      selectedTask: '',
      timerStart: {},
      timerEnd: {},
      isLoading: false
    }
  },

  computed: {
    ...mapGetters(['displayedTodos', 'timeSpentTotal']),

    taskOptions() {
      return this.displayedTodos.map(task => ({
        label: task.full_entity_name,
        value: task.id
      }))
    },

    currentTimer() {
      return this.timers.find(t => !t.end_time)
    },

    totalDuration() {
      let minutes = this.timeSpentTotal * 60
      if (this.currentTimer) {
        minutes += moment().diff(
          moment.utc(this.currentTimer.start_time),
          'minutes'
        )
      }
      return minutes
    }
  },

  watch: {
    taskOptions(newOptions) {
      if (!this.selectedTask && newOptions.length > 0) {
        this.selectedTask = newOptions[0].value
      }
    }
  },

  created() {
    const today = moment().format('YYYY-MM-DD')
    this.loadTodos({ date: today })
    this.loadUserTimeSpents({ date: today })
    this.fetchTimers()
  },

  methods: {
    ...mapActions({
      loadTimersAction: 'loadTimers',
      startTimerAction: 'startTimer',
      endTimerAction: 'endTimer',
      updateTimerAction: 'updateTimer',
      deleteTimerAction: 'deleteTimer',
      loadTodos: 'loadTodos',
      loadUserTimeSpents: 'loadUserTimeSpents'
    }),

    taskName(id) {
      const task = this.displayedTodos.find(t => t.id === id)
      return task ? task.full_entity_name : id
    },

    timerDuration(timer) {
      if (!timer.end_time) return moment().diff(timer.start_time, 'minutes')
      return moment(timer.end_time).diff(timer.start_time, 'minutes')
    },

    taskById(id) {
      return this.displayedTodos.find(t => t.id === id) || {}
    },

    fetchTimers() {
      this.isLoading = true
      this.loadTimersAction(this.today, true)
        .then(timers => {
          this.timers = timers
          this.isLoading = false
          this.initLocalTimes()
        })
        .catch(err => {
          console.error(err)
          this.timers = []
          this.isLoading = false
        })
    },

    initLocalTimes() {
      this.timerStart = {}
      this.timerEnd = {}
      this.timers.forEach(timer => {
        this.timerStart[timer.id] = moment
          .utc(timer.start_time)
          .local()
          .format('YYYY-MM-DDTHH:mm')
        if (timer.end_time) {
          this.timerEnd[timer.id] = moment
            .utc(timer.end_time)
            .local()
            .format('YYYY-MM-DDTHH:mm')
        }
      })
    },

    onStartTimer() {
      if (!this.selectedTask) return
      this.startTimerAction(this.selectedTask).then(this.fetchTimers)
    },

    onEndTimer() {
      this.endTimerAction().then(this.fetchTimers)
    },

    updateStart(timer) {
      const start_time = moment(this.timerStart[timer.id])
        .utc()
        .format('YYYY-MM-DDTHH:mm:00')
      this.updateTimerAction({ timerId: timer.id, data: { start_time } }).then(
        this.fetchTimers
      )
    },

    updateEnd(timer) {
      const end_time = moment(this.timerEnd[timer.id])
        .utc()
        .format('YYYY-MM-DDTHH:mm:00')
      this.updateTimerAction({ timerId: timer.id, data: { end_time } }).then(
        this.fetchTimers
      )
    },

    onDelete(timer) {
      this.deleteTimerAction(timer.id).then(this.fetchTimers)
    }
  },

  head() {
    return {
      title: `${this.$t('timers.title')} - Kitsu`
    }
  }
}
</script>

<style lang="scss" scoped>
.timers {
  padding-bottom: 1em;
}

.page-header {
  margin-bottom: 1em;
  align-items: center;
}

.page-footer {
  margin-top: 1em;
}

.logged-time {
  white-space: nowrap;
}

.title {
  margin-right: 1em;
  white-space: nowrap;
}

.start-button {
  background: #008c00;
  margin-bottom: 0.5em;
}

.discard-button {
  background: #8c0000;
}

.icon-button {
  width: 3em;
  height: 3em;
}
</style>
