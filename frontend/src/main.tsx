
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
              style: { borderRadius: '8px', background: '#fff', color: '#0F172A', fontSize: '13px' },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  
)
