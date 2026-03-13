import { getCommentPostErrorInfo } from '@/lib/comments'

describe('comment errors', () => {
  test('detects max retakes errors', () => {
    expect(
      getCommentPostErrorInfo({
        body: { message: 'Maximum retake count reached' }
      })
    ).toEqual({
      isRetakeError: true,
      key: 'comments.max_retakes_error',
      message: ''
    })
  })

  test('detects partial preview publish failures after comment creation', () => {
    expect(
      getCommentPostErrorInfo({
        status: 500,
        commentCreated: true
      })
    ).toEqual({
      isRetakeError: false,
      key: 'comments.error_preview_partial',
      message: ''
    })
  })

  test('maps common HTTP failures to user friendly messages', () => {
    expect(getCommentPostErrorInfo({ status: 413 }).key).toBe(
      'comments.error_too_large'
    )
    expect(getCommentPostErrorInfo({ status: 403 }).key).toBe(
      'comments.error_forbidden'
    )
    expect(getCommentPostErrorInfo({ status: 422 }).key).toBe(
      'comments.error_invalid'
    )
  })

  test('maps known backend validation messages to curated messages', () => {
    expect(
      getCommentPostErrorInfo({
        status: 422,
        body: { message: 'Preview revision 12 already exists.' }
      })
    ).toEqual({
      isRetakeError: false,
      key: 'comments.error_preview_revision_exists',
      message: ''
    })

    expect(
      getCommentPostErrorInfo({
        status: 400,
        body: { message: 'Normalization failed.' }
      })
    ).toEqual({
      isRetakeError: false,
      key: 'comments.error_preview_processing',
      message: ''
    })
  })

  test('maps missing status to network failure', () => {
    expect(getCommentPostErrorInfo({ message: 'Network Error' }).key).toBe(
      'comments.error_network'
    )
  })
})
