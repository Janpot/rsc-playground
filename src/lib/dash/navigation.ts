import invariant from "invariant";
import * as React from "react";

export interface AbstractNavigation {
  useNavigate: () => (
    url: string,
    options?: { history: "replace" | "push" },
  ) => void;
  usePathname: () => string;
  useSearchParams: () => URLSearchParams;
}

export const NavigationContext = React.createContext<
  AbstractNavigation | undefined
>(undefined);

function useNavgiationContext() {
  const navigation = React.useContext(NavigationContext);
  invariant(navigation, "No navigation context available");
  return navigation;
}

export function useNavigate() {
  const navigation = useNavgiationContext();
  return navigation.useNavigate();
}

export function usePathname() {
  const navigation = useNavgiationContext();
  return navigation.usePathname();
}

export function useSearchParams() {
  const navigation = useNavgiationContext();
  return navigation.useSearchParams();
}
