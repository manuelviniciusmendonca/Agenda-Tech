import { useContext } from "react";
import { AuthContext } from "./contextValue";

export function useAuth() {
  return useContext(AuthContext);
}