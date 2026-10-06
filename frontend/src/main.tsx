
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import store from './store/store'
import { AuthProvider } from './fetaures/Auth/redux/AuthProvider'
import AppRoutes from './routes/AppRoutes'
import './index.css'

createRoot(document.getElementById('root')!).render(

    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            gutter={8}
            containerStyle={{ top: '64px', right: '16px', zIndex: 999999 }}
            toastOptions={{
              duration: 2800,
              style: {
                borderRadius: '8px',
                background: '#fff',
                color: '#0F172A',
                fontSize: '13px',
                // Cap long messages to the viewport so toasts never trigger
                // horizontal scrolling on narrow screens.
                maxWidth: 'calc(100vw - 32px)',
                // Validation errors list one invalid field per line; render
                // the newlines instead of collapsing them into one run-on line.
                whiteSpace: 'pre-line',
              },
              // Backend validation errors can list several fields - give the
              // reader a little longer than the 2.8s used for simple toasts.
              error: { duration: 6000 },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  
)
