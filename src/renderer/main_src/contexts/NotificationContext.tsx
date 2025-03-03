import { createSignal, createContext, useContext, JSX } from "solid-js";

type NotificationContextType = {
  message: string;
  show: boolean;
  showNotification: (message: string, duration?: number) => void;
  hideNotification: () => void;
};

const NotificationContext = createContext<NotificationContextType>({
  message: "",
  show: false,
  showNotification: () => {},
  hideNotification: () => {},
});

export function NotificationProvider(props: { children: JSX.Element }) {
  const [notification, setNotification] = createSignal({ message: "", show: false });

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const showNotification = (message: string, duration = 5000) => {
    setNotification({ message, show: true });

    if (duration > 0) {
      setTimeout(() => {
        hideNotification();
      }, duration);
    }
  };

  const contextValue = {
    get message() { return notification().message; },
    get show() { return notification().show; },
    showNotification,
    hideNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {props.children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
