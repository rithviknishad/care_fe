import { ErrorHelperText } from "./ErrorHelperText";
import FieldLabel from "./FieldLabel";
import {
  FormFieldProps,
  getFormFieldChangeEventHandler,
  getFormFieldError,
} from "./Utils";

type FieldProps = {
  placeholder?: string;
  value?: string | number;
  autoComplete?: string;
  type?: "email" | "password" | "search" | "text";
};

type TextFormFieldProps = FormFieldProps<string, FieldProps>;

export default function TextFormField(props: TextFormFieldProps) {
  const handleChange = getFormFieldChangeEventHandler(props);
  const error = getFormFieldError(props);

  const bgColor = error ? "bg-red-50" : "bg-gray-200";
  const borderColor = error ? "border-red-500" : "border-gray-200";

  return (
    <div className={props.className}>
      <FieldLabel htmlFor={props.id} required={props.required}>
        {props.label}
      </FieldLabel>
      <input
        id={props.id}
        className={`w-full px-4 py-3 rounded ${bgColor} focus:bg-white ${borderColor} focus:border-primary-400 border-2 outline-none ring-0 transition-all duration-200 ease-in`}
        disabled={props.disabled}
        type={props.type || "text"}
        placeholder={props.placeholder}
        name={props.name}
        value={props.value}
        autoComplete={props.autoComplete}
        required={props.required}
        onChange={(event) => {
          event.preventDefault();
          handleChange(event.target);
        }}
      />
      <ErrorHelperText error={error} />
    </div>
  );
}
