import { createSignal, createContext, useContext, JSX } from "solid-js";

export type PageType = "main" | "settings" | "account" | "impressum" | "privacy" | "404" | "nesting";

type PageContextType = {
  active: () => PageType;  // Change to function to maintain reactivity
  setActive: (page: PageType) => void;
};

// Create context with default values
const PageContext = createContext<PageContextType>({
  active: () => "main" as PageType,
  setActive: () => {},
});

export function PageProvider(props: { children: JSX.Element }) {
  const [active, setActive] = createSignal<PageType>("main");

  const handleSetActive = (page: PageType) => {
    console.log("Setting active page to:", page);
    setActive(page); // Simplified setter
  };

  const contextValue: PageContextType = {
    active, // Pass the signal function directly
    setActive: handleSetActive,
  };

  return (
    <PageContext.Provider value={contextValue}>
      {props.children}
    </PageContext.Provider>
  );
}

export function usePage() {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error("usePage must be used within a PageProvider");
  }
  return context;
}
