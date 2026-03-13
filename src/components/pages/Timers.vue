<template>
  <div class="columns fixed-page">
    <div class="column main-column">
      <div class="timers page">
        <div class="page-header flexrow">
          <page-title class="flexrow-item title" :text="$t('timers.title')" />
        </div>
        <div class="flexrow">
          <combobox
            class="flexrow-item"
            :options="taskOptions"
            v-model="selectedTask"
            :label="$t('timers.task')"
            :placeholder="$t('timers.task')"
          />
          <button-simple
            class="flexrow-item icon-button start-button"
            :title="$t('timers.start')"
            icon="play"
            @click="onStartTimer"
          />
          <div class="filler"></div>
          <div class="flexrow-item current-date">
            <date-field
              :can-delete="false"
              :with-margin="false"
              v-model="selectedDate"
            />
          </div>
          <div class="flexrow-item flexrow time-spent-total">
            -&nbsp;&nbsp;
            {{ formatDuration(totalDuration) }} {{ $t('timesheets.hours') }}
          </div>
        </div>
        <div class="has-text-centered" v-if="isLoading">
          <spinner />
        </div>
        <div v-else>
          <table class="datatable" v-if="displayedTimers.length">
            <thead class="datatable-head">
              <tr class="datatable-row-header">
                <th
                  scope="col"
                  class="datatable-row-header datatable-row-header--nobd production"
                  ref="th-prod"
                >
                  {{ $t('tasks.fields.production') }}
                </th>
                <th
                  scope="col"
                  class="type datatable-row-header datatable-row-header--nobd"
                  ref="th-type"
                >
                  {{ $t('tasks.fields.task_type') }}
                </th>
                <th scope="col" class="name datatable-row-header">
                  {{ $t('tasks.fields.entity') }}
                </th>
                <th>{{ $t('timers.start_time') }}</th>
                <th>{{ $t('timers.end_time') }}</th>
                <th>{{ $t('timers.duration') }}</th>
                <th>{{ $t('timers.estimated') }}</th>
                <th class="end-cell"></th>
              </tr>
            </thead>
            <tbody class="datatable-body">
              <tr
                class="datatable-row"
                v-for="timer in displayedTimers"
                :key="timer.id"
              >
                <template v-if="taskForTimer(timer)">
                  <th
                    class="production datatable-row-header datatable-row-header--nobd"
                    scope="row"
                  >
                    <production-name-cell
                      :entry="productionMap.get(taskForTimer(timer).project_id)"
                      :only-avatar="true"
                    />
                  </th>
                  <task-type-cell
                    class="type datatable-row-header datatable-row-header--nobd"
                    :production-id="taskForTimer(timer).project_id"
                    :task-type="
                      taskTypeMap.get(taskForTimer(timer).task_type_id)
                    "
                  />
                  <th class="name datatable-row-header">
                    <router-link :to="entityPath(taskForTimer(timer))">
                      <div class="flexrow">
                        <entity-thumbnail
                          :empty-width="60"
                          :empty-height="40"
                          :entity="{
                            preview_file_id:
                              taskForTimer(timer).entity_preview_file_id
                          }"
                        />
                        <span>
                          {{ taskForTimer(timer).full_entity_name }}
                        </span>
                      </div>
                    </router-link>
                  </th>
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
                    {{ $t('timesheets.hours') }}
                  </td>
                  <td>
                    {{
                      formatDuration(taskDurationWithRunning(timer.task_id))
                    }}/{{ formatDuration(taskForTimer(timer).task_estimation) }}
                    {{ $t('timesheets.hours') }}
                  </td>
                  <td class="end-cell" style="text-align: right">
                    <template v-if="canStopTimer(timer)">
                      <button-simple
                        class="icon-button"
                        :title="$t('timers.stop')"
                        icon="stop"
                        @click="onEndTimer"
                      />
                    </template>
                    <template v-else-if="canDeleteTimer(timer)">
                      <button-simple
                        class="icon-button discard-button"
                        icon="trash"
                        @click="onDelete(timer)"
                      />
                    </template>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
          <div v-else>{{ $t('timers.no_timer') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment-timezone'
import { mapGetters, mapActions } from 'vuex'
import {
  getTimerDateOverlapMinutes,
  getTrackedMinutesByTaskForDate,
  isSameTaskId
} from '@/lib/timers'
import { formatSimpleDateUTC } from '@/lib/time'

import { formatListMixin } from '@/components/mixins/format'
import { timeMixin } from '@/components/mixins/time'
import Combobox from '@/components/widgets/Combobox.vue'
import PageTitle from '@/components/widgets/PageTitle.vue'
import ButtonSimple from '@/components/widgets/ButtonSimple.vue'
import Spinner from '@/components/widgets/Spinner.vue'
import DateField from '@/components/widgets/DateField.vue'
import ProductionNameCell from '@/components/cells/ProductionNameCell.vue'
import TaskTypeCell from '@/components/cells/TaskTypeCell.vue'
import EntityThumbnail from '@/components/widgets/EntityThumbnail.vue'

export default {
  name: 'timers',

  mixins: [formatListMixin, timeMixin],

  components: {
    Combobox,
    PageTitle,
    ButtonSimple,
    Spinner,
    DateField,
    ProductionNameCell,
    TaskTypeCell,
    EntityThumbnail
  },

  data() {
    return {
      selectedTask: '',
      selectedDate: new Date(),
      tick: 0,
      timerStart: {},
      timerEnd: {},
      isLoading: false
    }
  },

  computed: {
    ...mapGetters([
      'isCurrentUserAdmin',
      'currentTimer',
      'displayedTodos',
      'productionMap',
      'taskTypeMap',
      'timeSpentMap',
      'timers',
      'timersForDate'
    ]),

    taskOptions() {
      return this.displayedTodos.map(task => ({
        label: task.full_entity_name,
        value: task.id
      }))
    },

    selectedDateStr() {
      return formatSimpleDateUTC(this.selectedDate)
    },

    displayedTimers() {
      return this.timersForDate({
        date: this.selectedDateStr,
        timezone: this.timezone,
        now: moment.utc()
      })
    },

    totalDuration() {
      // Referencing the tick variable here is a hack to make Vue recompute this
      this.tick
      const now = moment.utc()
      return this.displayedTimers.reduce(
        (sum, timer) =>
          sum +
          getTimerDateOverlapMinutes(
            timer,
            this.selectedDateStr,
            this.timezone,
            now
          ),
        0
      )
    },

    trackedMinutesByTask() {
      // Referencing the tick variable here is a hack to make Vue recompute this
      this.tick
      return getTrackedMinutesByTaskForDate({
        timers: this.timers,
        date: this.selectedDateStr,
        timezone: this.timezone,
        now: moment.utc()
      })
    }
  },

  watch: {
    taskOptions(newOptions) {
      if (!this.selectedTask && newOptions.length > 0) {
        this.selectedTask = newOptions[0].value
      }
    },

    selectedDate() {
      const date = this.selectedDateStr
      this.loadTodos({ date })
      this.fetchTimers()
    }
  },

  created() {
    this.selectedDate = this.today
    this.startTick()
  },

  beforeUnmount() {
    clearInterval(this.tickInterval)
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

    entityPath(entity) {
      const entityType = entity.sequence_name ? 'shot' : 'asset'
      const route = {
        name: entityType,
        params: {
          production_id: entity.project_id
        }
      }

      if (entityType === 'asset') {
        route.params.asset_id = entity.entity_id
      } else {
        route.params.shot_id = entity.entity_id
      }

      if (entity.episode_id) {
        route.name = `episode-${entityType}`
        route.params.episode_id = entity.episode_id
      }

      return route
    },

    taskName(id) {
      const task = this.displayedTodos.find(t => t.id === id)
      return task ? task.full_entity_name : id
    },

    timerDuration(timer) {
      // Referencing the tick variable here is a hack to make Vue recompute this
      this.tick
      return getTimerDateOverlapMinutes(
        timer,
        this.selectedDateStr,
        this.timezone,
        moment.utc()
      )
    },

    taskDurationWithRunning(taskId) {
      const manualDuration = this.timeSpentMap[taskId]?.duration || 0
      const timerDuration = this.trackedMinutesByTask[String(taskId)] || 0
      return manualDuration + timerDuration
    },

    taskById(id) {
      return this.displayedTodos.find(t => isSameTaskId(t.id, id))
    },

    taskForTimer(timer) {
      return timer.task || this.taskById(timer.task_id)
    },

    isOwnTimer(timer) {
      return (
        !timer.person_id || String(timer.person_id) === String(this.user.id)
      )
    },

    canStopTimer(timer) {
      return !timer.end_time && this.isOwnTimer(timer)
    },

    canDeleteTimer(timer) {
      return this.isOwnTimer(timer) || this.isCurrentUserAdmin
    },

    fetchTimers() {
      this.isLoading = true
      this.loadTimersAction({ date: this.selectedDateStr, embedTask: true })
        .then(() => {
          this.isLoading = false
          this.initLocalTimes()
          return this.loadUserTimeSpents({ date: this.selectedDateStr })
        })
        .catch(err => {
          console.error(err)
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

    async onStartTimer() {
      if (!this.selectedTask) return
      await this.startTimerAction(this.selectedTask)
      this.fetchTimers()
    },

    onEndTimer() {
      if (!this.currentTimer || !this.isOwnTimer(this.currentTimer)) {
        return
      }

      this.endTimerAction().then(this.fetchTimers)
    },

    startTick() {
      this.tickInterval = setInterval(() => {
        this.tick++
      }, 60000)
    },

    updateStart(timer) {
      if (!this.isOwnTimer(timer)) {
        this.initLocalTimes()
        return
      }

      const start_time = moment(this.timerStart[timer.id])
        .utc()
        .format('YYYY-MM-DDTHH:mm:00')
      this.updateTimerAction({ timerId: timer.id, data: { start_time } }).then(
        this.fetchTimers
      )
    },

    updateEnd(timer) {
      if (!this.isOwnTimer(timer)) {
        this.initLocalTimes()
        return
      }

      const end_time = moment(this.timerEnd[timer.id])
        .utc()
        .format('YYYY-MM-DDTHH:mm:00')
      this.updateTimerAction({ timerId: timer.id, data: { end_time } }).then(
        this.fetchTimers
      )
    },

    onDelete(timer) {
      if (!this.canDeleteTimer(timer)) {
        return
      }

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

.datatable-body tr:first-child th,
.datatable-body tr:first-child td {
  border-top: 0;
}

.name {
  width: 230px;
  min-width: 230px;
}

.name a {
  color: inherit;
}

.production {
  width: 70px;
  min-width: 70px;
  max-width: 70px;
}

.type {
  width: 160px;
  min-width: 160px;
}

td.name {
  font-weight: bold;
}

.thumbnail {
  min-width: 60px;
  max-width: 60px;
  width: 60px;
  padding: 0;
}

.time-spent-total {
  font-size: 1.6em;
  line-height: 1.7em;
}
</style>
