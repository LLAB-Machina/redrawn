import { Language } from "@/i18n/constants";
import { ComponentType } from "react";

export function withLanguage<T extends object>(
  Component: ComponentType<T & { lng: Language }>,
  lng: Language,
) {
  return function WrappedComponent(props: T) {
    return <Component {...props} lng={lng} />;
  };
}
