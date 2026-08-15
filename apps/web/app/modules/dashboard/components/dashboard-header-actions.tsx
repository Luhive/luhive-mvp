import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { SiteHeader } from "~/modules/dashboard/components/site-header";

type DashboardHeaderActionsContextValue = {
  actions: ReactNode;
  setActions: (actions: ReactNode) => void;
};

const DashboardHeaderActionsContext =
  createContext<DashboardHeaderActionsContextValue | null>(null);

export function DashboardHeaderActionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [actions, setActions] = useState<ReactNode>(null);

  return (
    <DashboardHeaderActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </DashboardHeaderActionsContext.Provider>
  );
}

function useDashboardHeaderActionsContext() {
  const context = useContext(DashboardHeaderActionsContext);
  if (!context) {
    throw new Error(
      "useDashboardHeaderActions must be used within DashboardHeaderActionsProvider",
    );
  }
  return context;
}

export function useDashboardHeaderActions(
  actions: ReactNode,
  deps: React.DependencyList,
) {
  const { setActions } = useDashboardHeaderActionsContext();

  useEffect(() => {
    setActions(actions);
    return () => setActions(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls when actions update
  }, [setActions, ...deps]);
}

export function DashboardSiteHeader({ title }: { title?: string }) {
  const { actions } = useDashboardHeaderActionsContext();
  return <SiteHeader title={title} actions={actions} />;
}
