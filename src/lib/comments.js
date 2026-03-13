const getServerMessage = err => {
  const message = err?.body?.message || err?.response?.body?.message || ''
  return typeof message === 'string' ? message.trim() : ''
}

const getMappedBackendErrorKey = normalizedMessage => {
  if (!normalizedMessage) {
    return ''
  }

  if (normalizedMessage.includes('retake')) {
    return 'comments.max_retakes_error'
  }

  if (
    normalizedMessage.includes('revision') &&
    normalizedMessage.includes('already exists')
  ) {
    return 'comments.error_preview_revision_exists'
  }

  if (normalizedMessage.includes('normalization failed')) {
    return 'comments.error_preview_processing'
  }

  if (
    normalizedMessage.includes('wrong file format') ||
    normalizedMessage.includes('extension not allowed')
  ) {
    return 'comments.error_preview_format'
  }

  if (normalizedMessage.includes('file not provided')) {
    return 'comments.error_file_missing'
  }

  return ''
}

export const getCommentPostErrorInfo = err => {
  const message = getServerMessage(err)
  const normalizedMessage = String(message).toLowerCase()
  const status = err?.status || err?.response?.status
  const mappedBackendErrorKey = getMappedBackendErrorKey(normalizedMessage)

  if (normalizedMessage.includes('retake')) {
    return {
      isRetakeError: true,
      key: 'comments.max_retakes_error',
      message: ''
    }
  }

  if (err?.commentCreated) {
    return {
      isRetakeError: false,
      key: 'comments.error_preview_partial',
      message: ''
    }
  }

  if (status === 413) {
    return {
      isRetakeError: false,
      key: 'comments.error_too_large',
      message: ''
    }
  }

  if (status === 403) {
    return {
      isRetakeError: false,
      key: 'comments.error_forbidden',
      message: ''
    }
  }

  if (status === 404) {
    return {
      isRetakeError: false,
      key: 'comments.error_task_missing',
      message: ''
    }
  }

  if (status === 408 || status === 504 || err?.timeout) {
    return {
      isRetakeError: false,
      key: 'comments.error_timeout',
      message: ''
    }
  }

  if (status === 400 || status === 409 || status === 422) {
    return {
      isRetakeError: false,
      key: mappedBackendErrorKey || 'comments.error_invalid',
      message: ''
    }
  }

  if (!status) {
    return {
      isRetakeError: false,
      key: 'comments.error_network',
      message: ''
    }
  }

  return {
    isRetakeError: false,
    key: mappedBackendErrorKey || 'comments.error',
    message: ''
  }
}
