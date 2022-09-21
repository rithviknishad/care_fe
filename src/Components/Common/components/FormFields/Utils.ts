import { Dispatch } from "react";

type FormFieldChangeEvent<T> = { name: string; value: T };

export type FormFieldChangeEventHandler<T = any> = (
  event: FormFieldChangeEvent<T>
) => void;

type FormFieldBaseProps<T> = {
  id?: string;
  name: string;
  label: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  validate?: (value: T) => string | undefined;
} & (
  | {
      error: undefined;
      value: undefined;
      onChange: undefined;
      reducerProps: {
        state: FormState<any>;
        dispatch: Dispatch<FormAction<any>>;
      };
    }
  | {
      reducerProps: undefined;
      error?: string;
      value?: T;
      onChange: FormFieldChangeEventHandler<T>;
    }
);

export type FormFieldProps<V, F> = FormFieldBaseProps<V> & F;
export type Errors<T> = Partial<Record<keyof T, string>>;
export type FormState<T> = { form: T; errors: Errors<T> };

type FormAction<T> =
  | { type: "set_form"; form: T }
  | { type: "set_errors"; errors: Errors<T> }
  | { type: "set_field"; name: keyof T; value: any; error?: string };

export type FormReducer<T> = (
  prevState: FormState<T>,
  action: FormAction<T>
) => FormState<T>;

export const formReducer = <T>(
  state: FormState<T>,
  action: FormAction<T>
): FormState<T> => {
  switch (action.type) {
    case "set_form":
      return { ...state, form: action.form };
    case "set_errors":
      return { ...state, errors: action.errors };
    case "set_field":
      return {
        form: { ...state.form, [action.name]: action.value },
        errors: { ...state.errors, [action.name]: action.error },
      };
  }
};

export function handleFormFieldChange<T, FieldValueType>(
  state: FormState<T>,
  dispatch: Dispatch<FormAction<T>>
) {
  return (event: FormFieldChangeEvent<FieldValueType>) => {
    const { name, value } = event;
    dispatch({
      type: "set_form",
      form: { ...state.form, [name]: value },
    });
  };
}

export const getFormFieldChangeEventHandler = <T>(
  props: FormFieldBaseProps<T>
): FormFieldChangeEventHandler<T> => {
  if (props.onChange) return props.onChange;

  const { state, dispatch } = props.reducerProps;

  if (props.validate)
    return (event) => {
      const { name, value } = event;
      const error = props.validate && props.validate(value);
      dispatch({
        type: "set_field",
        name,
        value,
        error,
      });
    };

  return (event) => {
    const { name, value } = event;
    dispatch({
      type: "set_form",
      form: { ...state.form, [name]: value },
    });
  };
};

export const getFormFieldError = <T>(props: FormFieldBaseProps<T>) =>
  props.reducerProps?.state.errors[props.name] || props.error;
