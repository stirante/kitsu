import store from '@/store/modules/timers'
import timersApi from '@/store/api/timers'
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

    test('timersForDate includes a running timer immediately after start', () => {
      const state = {
        timers: [
          {
            id: '1',
            task_id: 't1',
            start_time: '2024-01-01T10:00:30Z',
            end_time: null
          }
        ]
      }

      expect(
        store.getters.timersForDate(state)({
          date: '2024-01-01',
          timezone: 'UTC',
          now: moment.utc('2024-01-01T10:00:31Z')
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
      const state = {
        timers: [],
        currentQuery: { date: undefined, embedTask: true }
      }
      store.mutations[LOAD_TIMERS_END](state, {
        timers: [{ id: '1' }],
        query: { date: '2024-01-01', embedTask: false }
      })
      expect(state.timers).toEqual([{ id: '1' }])
      expect(state.currentQuery).toEqual({
        date: '2024-01-01',
        embedTask: false
      })
    })

    test('LOAD_TIMERS_END normalizes embedded task fields used by timers page', () => {
      const state = {
        timers: [],
        currentQuery: { date: undefined, embedTask: true }
      }

      store.mutations[LOAD_TIMERS_END](state, {
        timers: [
          {
            id: '1',
            task_id: 't1',
            start_time: '2024-01-01T10:00:00Z',
            end_time: null,
            task: {
              id: 't1',
              entity_name: 'Robot',
              entity_type_name: 'Asset',
              estimation: 120,
              last_preview_file_id: 'preview-1'
            }
          }
        ],
        query: { date: '2024-01-01', embedTask: true }
      })

      expect(state.timers[0].task.full_entity_name).toBe('Asset / Robot')
      expect(state.timers[0].task.task_estimation).toBe(120)
      expect(state.timers[0].task.entity_preview_file_id).toBe('preview-1')
    })

    test('RESET_ALL', () => {
      const state = {
        timers: [{ id: '1' }],
        currentQuery: { date: '2024-01-01', embedTask: false }
      }
      store.mutations[RESET_ALL](state)
      expect(state.timers).toEqual([])
      expect(state.currentQuery).toEqual({
        date: undefined,
        embedTask: true
      })
    })
  })

  describe('Actions', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    test('endTimer reloads timers when backend discards a too-short timer', async () => {
      const dispatch = vi.fn().mockResolvedValue([])
      const state = {
        currentQuery: { date: '2024-01-01', embedTask: true }
      }

      vi.spyOn(timersApi, 'endTimer').mockRejectedValue({
        response: {
          body: {
            message: 'Timer too short'
          }
        }
      })

      await expect(store.actions.endTimer({ dispatch, state })).resolves.toEqual(
        []
      )
      expect(dispatch).toHaveBeenCalledWith('loadTimers', state.currentQuery)
    })

    test('startTimer still starts a new timer when the previous one was too short', async () => {
      const dispatch = vi.fn().mockResolvedValue([])
      const state = {
        currentQuery: { date: '2024-01-01', embedTask: true }
      }
      const getters = {
        currentTimer: {
          id: 'timer-1',
          task_id: 'old-task',
          end_time: null
        }
      }

      vi.spyOn(timersApi, 'endTimer').mockRejectedValue({
        response: {
          body: {
            message: 'Timer too short'
          }
        }
      })
      const startSpy = vi.spyOn(timersApi, 'startTimer').mockResolvedValue({})

      await expect(
        store.actions.startTimer({ dispatch, getters, state }, 'new-task')
      ).resolves.toEqual([])

      expect(startSpy).toHaveBeenCalledWith('new-task')
      expect(dispatch).toHaveBeenCalledWith('loadTimers', state.currentQuery)
    })
  })
})
