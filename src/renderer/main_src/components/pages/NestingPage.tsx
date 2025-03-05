import { usePage } from '../../contexts/AppContext'
import type { Component } from 'solid-js'

const NestingPage: Component = () => {
  const { setActive } = usePage()
  return (
    <div class="p-6 dark:bg-gray-900 dark:text-white">
      <h1 class="text-3xl font-bold mb-4">Hauptseite</h1>
      <p class="text-gray-700 dark:text-gray-300">Willkommen auf der Hauptseite von Deepnest!</p>
      <button
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        onClick={() => setActive('main')}
      >
        Zur Startseite
      </button>
    </div>
  )
}

export default NestingPage
