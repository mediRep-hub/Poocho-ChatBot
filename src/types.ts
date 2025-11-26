export interface Chat {
  hideInChat?: boolean;
  role: "user" | "model";
  text: string;
  isError?: boolean;
}
