import axios, { type AxiosAdapter } from 'axios'
import { message } from 'antd'
import { apiUrl } from './apiBase'
import { getLocalMockPayload, shouldUseLocalMocks } from '../mocks/localApi'

const defaultAdapter = axios.getAdapter(axios.defaults.adapter)

const localMockAdapter: AxiosAdapter = async (config) => {
  const mockData = getLocalMockPayload(config.method, config.url)
  if (mockData) {
    return {
      data: mockData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      request: null,
    }
  }

  return defaultAdapter(config)
}

const request = axios.create({
  baseURL: apiUrl('/api'),
  timeout: 30000,
  adapter: shouldUseLocalMocks() ? localMockAdapter : defaultAdapter,
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data } = response
    if (data.success === false) {
      message.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    return data
  },
  (error) => {
    const mockData = getLocalMockPayload(error.config?.method, error.config?.url)
    if (mockData) {
      return mockData
    }

    message.error(error.message || '网络请求失败')
    return Promise.reject(error)
  }
)

export default request
