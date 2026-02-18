import { render } from '@testing-library/react';
import { ToastProvider } from '../components/Common/Toast';
import { AuthProvider } from '../contexts/AuthContext';
import { ReportsProvider } from '../contexts/ReportsContext';

const AllProviders = ({ children }) => {
  return (
    <ToastProvider>
      <AuthProvider>
        <ReportsProvider>
          {children}
        </ReportsProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

const customRender = (ui, options) => {
  return render(ui, { wrapper: AllProviders, ...options });
};

const simpleRender = (ui, options) => {
  return render(ui, options);
};

export * from '@testing-library/react';
export { customRender as render, simpleRender };
