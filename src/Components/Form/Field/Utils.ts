import { Dispatch } from "react";
import { FieldError, FormAction, FormDetails, FormState } from "../Utils";

type FieldChangeEvent<T> = { name: string; value: T };
export type FieldChangeEventHandler<T> = (event: FieldChangeEvent<T>) => void;

export type FieldValidator<T> = (value: T) => FieldError;

export type FormFieldBaseProps<T> = {
  id?: string;
  name: string;
  label: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  errorClass?: string;
  labelClass?: string;
} & (
  | {
      error?: undefined;
      value?: undefined;
      onChange?: undefined;
      reducerProps: { state: FormState; dispatch: Dispatch<FormAction> };
      validate: FieldValidator<T>;
    }
  | {
      error: FieldError;
      value?: T;
      onChange: FieldChangeEventHandler<T>;
      reducerProps?: undefined;
      validate?: undefined;
    }
);

export const handleFormFieldChange = <V, F = FormDetails>(
  state: FormState<F>,
  dispatch: Dispatch<FormAction<F>>
) => {
  return (event: FieldChangeEvent<V>) => {
    const { name, value } = event;
    dispatch({ type: "set_form", form: { ...state.form, [name]: value } });
  };
};

export const resolveFormFieldChangeEventHandler = <T>(
  props: FormFieldBaseProps<T>
): FieldChangeEventHandler<T> => {
  if (props.onChange) return props.onChange;

  const { dispatch } = props.reducerProps;
  return (event) => {
    const { name, value } = event;
    const error = props.validate(event.value);
    dispatch({ type: "set_field", name, value, error });
  };
};

export const resolveFormFieldError = <T>(props: FormFieldBaseProps<T>) =>
  props.reducerProps?.state.errors[props.name] || props.error;
