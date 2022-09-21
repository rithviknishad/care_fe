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
  rows?: number;
};

type TextAreaFormFieldProps = FormFieldProps<string, FieldProps>;

export const TextAreaFormField = ({
  rows = 3,
  ...props
}: TextAreaFormFieldProps) => {
  const handleChange = getFormFieldChangeEventHandler(props);
  const error = getFormFieldError(props);

  const bgColor = props.error ? "bg-red-50" : "bg-gray-200";
  const borderColor = props.error ? "border-red-500" : "border-gray-200";

  return (
    <div className={props.className}>
      <FieldLabel htmlFor={props.id} required={props.required}>
        {props.label}
      </FieldLabel>
      <textarea
        id={props.id}
        className={`resize-none w-full px-4 py-3 rounded ${bgColor} ${borderColor} focus:border-primary-400 border-2 outline-none ring-0 focus:bg-white transition-all duration-200 ease-in`}
        disabled={props.disabled}
        rows={rows}
        placeholder={props.placeholder}
        name={props.name}
        value={props.value}
        required={props.required}
        onChange={(event) => {
          event.preventDefault();
          handleChange(event.target);
        }}
      />
      <ErrorHelperText error={error} />
    </div>
  );
};
