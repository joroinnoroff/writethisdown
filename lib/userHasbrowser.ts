import { useState, useEffect } from "react";

export const userHasBrowser = () => {
  const [hasBrowser, setHasBrowser] = useState(false);

  useEffect(() => {
    setHasBrowser(true)
  }, []);

  return hasBrowser
};