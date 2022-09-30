import { ReactNode } from "react";
import { FieldError } from "../Utils";
import { FormFieldBaseProps, resolveFormFieldError } from "./Utils";

type FieldLabelProps = {
  required?: boolean;
  htmlFor?: string;
  children: string;
};

export const FieldLabel = (props: FieldLabelProps) => {
  return (
    <label className="mb-2 block" htmlFor={props.htmlFor}>
      {props.children}
      {props.required && <span className="text-red-500">{" *"}</span>}
    </label>
  );
};

export const FieldErrorText = (props: { error: FieldError }) => {
  return (
    <span
      className={`font-medium tracking-wide text-red-500 text-xs mt-2 ml-1 ${
        props.error ? "opacity-100" : "opacity-0"
      } transition-opacity duration-300`}
    >
      {props.error}
    </span>
  );
};

const FormField = (props: {
  props: FormFieldBaseProps<any>;
  children: ReactNode;
}) => {
  const { id, className, required, label } = props.props;

  return (
    <div className={className}>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      {props.children}
      <FieldErrorText error={resolveFormFieldError(props.props)} />
    </div>
  );
};

export default FormField;
