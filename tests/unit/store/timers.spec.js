import store from '@/store/modules/timers'
import { LOAD_TIMERS_END, RESET_ALL } from '@/store/mutation-types'
import moment from 'moment-timezone'

describe('Timers store', () => {
  describe('Getters', () => {
    const timers = [
      { id: '1', task_id: 't1', start_time: '2024-01-01T10:00:00Z', end_time: null },
      { id: '2', task_id: 't2', start_time: '2024-01-01T08:00:00Z', end_time: '2024-01-01T09:00:00Z' }
    ]

    test('timers', () => {
      const state = { timers }
      expect(store.getters.timers(state)).toStrictEqual(timers)
    })

    test('currentTimer', () => {
      const state = { timers }
      expect(store.getters.currentTimer(state)).toStrictEqual(timers[0])
    })

    test('isTaskTimerRunning', () => {
      const state = { timers }
      const getters = {
        currentTimer: store.getters.currentTimer(state)
      }

      expect(store.getters.isTaskTimerRunning(state, getters)('t1')).toBe(true)
      expect(store.getters.isTaskTimerRunning(state, getters)('t2')).toBe(false)
    })

    test('timersForDate', () => {
      const state = {
        timers: [
          {
            id: '1',
            task_id: 't1',
            start_time: '2024-01-01T22:30:00Z',
            end_time: '2024-01-02T01:30:00Z'
          }
        ]
      }

      expect(
        store.getters.timersForDate(state)({
          date: '2024-01-02',
          timezone: 'Europe/Warsaw'
        })
      ).toHaveLength(1)
      expect(
        store.getters.timersForDate(state)({
          date: '2024-01-01',
          timezone: 'UTC'
        })
      ).toHaveLength(1)
    })

    test('trackedTaskDurationForDate', () => {
      const state = {
        timers: [
          {
            id: '1',
            task_id: 't1',
            start_time: '2024-01-01T10:00:00Z',
            end_time: '2024-01-01T11:00:00Z'
          },
          {
            id: '2',
            task_id: 't1',
            start_time: '2024-01-01T12:00:00Z',
            end_time: null
          }
        ]
      }

      expect(
        store.getters.trackedTaskDurationForDate(state)({
          taskId: 't1',
          date: '2024-01-01',
          timezone: 'UTC',
          manualDuration: 120,
          now: moment.utc('2024-01-01T12:30:00Z')
        })
      ).toBe(210)
    })
  })

  describe('Mutations', () => {
    test('LOAD_TIMERS_END', () => {
      const state = { timers: [] }
      store.mutations[LOAD_TIMERS_END](state, [{ id: '1' }])
      expect(state.timers).toEqual([{ id: '1' }])
    })

    test('RESET_ALL', () => {
      const state = { timers: [{ id: '1' }] }
      store.mutations[RESET_ALL](state)
      expect(state.timers).toEqual([])
    })
  })
})
