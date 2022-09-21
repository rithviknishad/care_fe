import loadable from "@loadable/component";
import {
  Box,
  Button,
  CardContent,
  FormControlLabel,
  InputLabel,
  Radio,
  RadioGroup,
} from "@material-ui/core";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import { navigate } from "raviger";
import moment from "moment";
import React, {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useReducer,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import {
  CONSULTATION_SUGGESTION,
  PATIENT_CATEGORIES,
  SYMPTOM_CHOICES,
  TELEMEDICINE_ACTIONS,
  REVIEW_AT_CHOICES,
  KASP_STRING,
  KASP_ENABLED,
} from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  createConsultation,
  getConsultation,
  updateConsultation,
  getPatient,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { FacilitySelect } from "../Common/FacilitySelect";
import {
  DateInputField,
  ErrorHelperText,
  MultilineInputField,
  MultiSelectField,
  NativeSelectField,
  SelectField,
  TextInputField,
} from "../Common/HelperInputFields";
import { BedModel, FacilityModel } from "./models";
import { OnlineUsersSelect } from "../Common/OnlineUsersSelect";
import { UserModel } from "../Users/models";
import { MaterialUiPickersDate } from "@material-ui/pickers/typings/date";
import { BedSelect } from "../Common/BedSelect";
import Beds from "./Consultations/Beds";
import PrescriptionBuilder, {
  PrescriptionType,
} from "../Common/prescription-builder/PrescriptionBuilder";
import PRNPrescriptionBuilder, {
  PRNPrescriptionType,
} from "../Common/prescription-builder/PRNPrescriptionBuilder";
import { DiagnosisSelect } from "../Common/DiagnosisSelect";
import InvestigationBuilder, {
  InvestigationType,
} from "../Common/prescription-builder/InvestigationBuilder";
import { ICD11DiagnosisModel } from "./models";
import TextFormField from "../Common/components/FormFields/TextFormField";
import { Form } from "../Common/components/FormFields/Form";
import { scrollTo } from "../../Utils/utils";
import { TextAreaFormField } from "../Common/components/FormFields/TextAreaFormField";
import {
  FormFieldChangeEventHandler,
  FormReducer,
  formReducer,
  FormState,
} from "../Common/components/FormFields/Utils";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

type BooleanStrings = "true" | "false";

type FormDetails = {
  hasSymptom: boolean;
  otherSymptom: boolean;
  symptoms: number[];
  other_symptoms: string;
  symptoms_onset_date: any;
  suggestion: string;
  patient: string;
  facility: string;
  admitted: BooleanStrings;
  admitted_to: string;
  category: string;
  admission_date: string;
  discharge_date: null;
  referred_to: string;
  icd11_diagnoses: string[];
  icd11_diagnoses_object: ICD11DiagnosisModel[];
  verified_by: string;
  is_kasp: BooleanStrings;
  kasp_enabled_date: null;
  examination_details: string;
  history_of_present_illness: string;
  prescribed_medication: string;
  consultation_notes: string;
  ip_no: string;
  discharge_advice: PrescriptionType[];
  prn_prescription: PRNPrescriptionType[];
  investigation: InvestigationType[];
  is_telemedicine: BooleanStrings;
  action: string;
  assigned_to: string;
  assigned_to_object: UserModel | null;
  special_instruction: string;
  review_time: number;
  weight: string;
  height: string;
  bed: string | null;
};

type Action =
  | { type: "set_form"; form: FormDetails }
  | { type: "set_error"; errors: FormDetails };

const initForm: FormDetails = {
  hasSymptom: false,
  otherSymptom: false,
  symptoms: [],
  other_symptoms: "",
  symptoms_onset_date: null,
  suggestion: "A",
  patient: "",
  facility: "",
  admitted: "false",
  admitted_to: "",
  category: "Comfort Care",
  admission_date: new Date().toISOString(),
  discharge_date: null,
  referred_to: "",
  icd11_diagnoses: [],
  icd11_diagnoses_object: [],
  verified_by: "",
  is_kasp: "false",
  kasp_enabled_date: null,
  examination_details: "",
  history_of_present_illness: "",
  prescribed_medication: "",
  consultation_notes: "",
  ip_no: "",
  discharge_advice: [],
  prn_prescription: [],
  investigation: [],
  is_telemedicine: "false",
  action: "PENDING",
  assigned_to: "",
  assigned_to_object: null,
  special_instruction: "",
  review_time: 0,
  weight: "",
  height: "",
  bed: null,
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

const consultationFormReducer = (state = initialState, action: Action) => {
  switch (action.type) {
    case "set_form": {
      return {
        ...state,
        form: action.form,
      };
    }
    case "set_error": {
      return {
        ...state,
        errors: action.errors,
      };
    }
  }
};

const suggestionTypes = [
  {
    id: 0,
    text: "Select the decision",
  },
  ...CONSULTATION_SUGGESTION,
];

const symptomChoices = [...SYMPTOM_CHOICES];

const goBack = () => {
  window.history.go(-1);
};

type Props = { facilityId: string; patientId: string; id?: string };

const formDetailsReducer: FormReducer<FormDetails> = formReducer;

export const ConsultationForm = ({ facilityId, patientId, id }: Props) => {
  const dispatchAction: any = useDispatch();
  const [oldState, oldDispatch] = useReducer(
    consultationFormReducer,
    initialState
  );

  const [state, dispatch] = useReducer(
    formReducer,
    initialState as FormState<FormDetails>
  );

  const [bed, setBed] = useState<BedModel | BedModel[] | null>(null);
  const [dischargeAdvice, setDischargeAdvice] = useState<PrescriptionType[]>(
    []
  );
  const [PRNAdvice, setPRNAdvice] = useState<PRNPrescriptionType[]>([]);
  const [InvestigationAdvice, setInvestigationAdvice] = useState<
    InvestigationType[]
  >([]);

  const [selectedFacility, setSelectedFacility] =
    useState<FacilityModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [facilityName, setFacilityName] = useState("");

  const headerText = !id ? "Consultation" : "Edit Consultation";
  const buttonText = !id ? "Add Consultation" : "Update Consultation";

  useEffect(() => {
    async function fetchPatientName() {
      if (patientId) {
        const res = await dispatchAction(getPatient({ id: patientId }));
        if (res.data) {
          setPatientName(res.data.name);
          setFacilityName(res.data.facility_object.name);
        }
      } else {
        setPatientName("");
        setFacilityName("");
      }
    }
    fetchPatientName();
  }, [dispatchAction, patientId]);

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = id && (await dispatchAction(getConsultation(id)));
      setDischargeAdvice(res && res.data && res.data.discharge_advice);
      setPRNAdvice(
        !Array.isArray(res.data.prn_prescription)
          ? []
          : res.data.prn_prescription
      );
      setInvestigationAdvice(
        !Array.isArray(res.data.investigation) ? [] : res.data.investigation
      );

      if (!status.aborted) {
        if (res && res.data) {
          const formData = {
            ...res.data,
            hasSymptom:
              !!res.data.symptoms &&
              !!res.data.symptoms.length &&
              !!res.data.symptoms.filter((i: number) => i !== 1).length,
            otherSymptom:
              !!res.data.symptoms &&
              !!res.data.symptoms.length &&
              !!res.data.symptoms.filter((i: number) => i === 9).length,
            admitted: res.data.admitted ? String(res.data.admitted) : "false",
            admitted_to: res.data.admitted_to ? res.data.admitted_to : "",
            category: res.data.category || "Comfort Care",
            ip_no: res.data.ip_no ? res.data.ip_no : "",
            verified_by: res.data.verified_by ? res.data.verified_by : "",
            OPconsultation: res.data.consultation_notes,
            is_telemedicine: `${res.data.is_telemedicine}`,
            is_kasp: `${res.data.is_kasp}`,
            assigned_to: res.data.assigned_to || "",
            ett_tt: res.data.ett_tt ? Number(res.data.ett_tt) : 3,
            special_instruction: res.data.special_instruction || "",
            weight: res.data.weight ? res.data.weight : "",
            height: res.data.height ? res.data.height : "",
            bed: res.data?.current_bed?.bed_object?.id || null,
          };
          oldDispatch({ type: "set_form", form: formData });
        } else {
          goBack();
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, id]
  );

  useAbortableEffect(
    (status: statusType) => {
      if (id) {
        fetchData(status);
      }
    },
    [oldDispatch, fetchData]
  );

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;
    let error_div = "";

    Object.keys(oldState.form).forEach((field) => {
      switch (field) {
        case "symptoms":
          if (!oldState.form[field] || !oldState.form[field].length) {
            errors[field] = "Please select the symptoms";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "category":
          if (
            !oldState.form[field] ||
            !PATIENT_CATEGORIES.includes(oldState.form[field])
          ) {
            errors[field] = "Please select a category";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "suggestion":
          if (!oldState.form[field]) {
            errors[field] = "Please enter the decision";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "ip_no":
          if (!oldState.form[field]) {
            errors[field] = "Please enter IP Number";
            if (!error_div) error_div = field;
            invalidForm = true;
          } else if (!oldState.form[field].replace(/\s/g, "").length) {
            errors[field] = "IP can not be empty";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "other_symptoms":
          if (oldState.form.otherSymptom && !oldState.form[field]) {
            errors[field] = "Please enter the other symptom details";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "symptoms_onset_date":
          if (oldState.form.hasSymptom && !oldState.form[field]) {
            errors[field] = "Please enter date of onset of the above symptoms";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        // case "admitted_to":
        case "admission_date":
          if (oldState.form.suggestion === "A" && !oldState.form[field]) {
            errors[field] = "Field is required as person is admitted";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "referred_to":
          if (oldState.form.suggestion === "R" && !oldState.form[field]) {
            errors[field] = "Please select the referred to facility";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "consultation_notes":
          if (!oldState.form[field]) {
            errors[field] = "Required *";
            if (!error_div) error_div = field;
            invalidForm = true;
          } else if (!oldState.form[field].replace(/\s/g, "").length) {
            errors[field] = "Consultation notes can not be empty";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "is_telemedicine":
          if (
            oldState.form.admitted_to === "Home Isolation" &&
            oldState.form[field] === "false"
          ) {
            errors[field] =
              "Telemedicine should be `Yes` when Admitted To is Home Isolation";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "is_kasp":
          if (!oldState.form[field]) {
            errors[
              field
            ] = `Please select an option, ${KASP_STRING} is mandatory`;
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "discharge_advice": {
          let invalid = false;
          for (const f of dischargeAdvice) {
            if (
              !f.dosage?.replace(/\s/g, "").length ||
              !f.medicine?.replace(/\s/g, "").length
            ) {
              invalid = true;
              break;
            }
          }
          if (invalid) {
            errors[field] = "Prescription field can not be empty";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        }
        case "prn_prescription": {
          let invalid = false;
          for (const f of PRNAdvice) {
            if (
              !f.dosage?.replace(/\s/g, "").length ||
              !f.medicine?.replace(/\s/g, "").length ||
              f.indicator === "" ||
              f.indicator === " "
            ) {
              invalid = true;
              break;
            }
          }
          if (invalid) {
            errors[field] = "PRN Prescription field can not be empty";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        }

        case "investigation": {
          let invalid = false;
          for (const f of InvestigationAdvice) {
            if (
              f.type?.length === 0 ||
              (f.repetitive
                ? !f.frequency?.replace(/\s/g, "").length
                : !f.time?.replace(/\s/g, "").length)
            ) {
              invalid = true;
              break;
            }
          }
          if (invalid) {
            errors[field] = "Investigation Suggestion field can not be empty";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        }
        default:
          return;
      }
    });
    oldDispatch({ type: "set_error", errors });
    return [!invalidForm, error_div];
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const [validForm, error_div] = validateForm();

    if (!validForm) {
      scrollTo(`${error_div}-div`);
    } else {
      setIsLoading(true);
      const data = {
        symptoms: oldState.form.symptoms,
        other_symptoms: oldState.form.otherSymptom
          ? oldState.form.other_symptoms
          : undefined,
        symptoms_onset_date: oldState.form.hasSymptom
          ? oldState.form.symptoms_onset_date
          : undefined,
        suggestion: oldState.form.suggestion,
        admitted: oldState.form.suggestion === "A",
        admission_date:
          oldState.form.suggestion === "A"
            ? oldState.form.admission_date
            : undefined,
        category: oldState.form.category,
        is_kasp: oldState.form.is_kasp,
        kasp_enabled_date: JSON.parse(oldState.form.is_kasp)
          ? new Date()
          : null,
        examination_details: oldState.form.examination_details,
        history_of_present_illness: oldState.form.history_of_present_illness,
        prescribed_medication: oldState.form.prescribed_medication,
        discharge_date: oldState.form.discharge_date,
        ip_no: oldState.form.ip_no,
        icd11_diagnoses: oldState.form.icd11_diagnoses,
        verified_by: oldState.form.verified_by,
        discharge_advice: dischargeAdvice,
        prn_prescription: PRNAdvice,
        investigation: InvestigationAdvice,
        patient: patientId,
        facility: facilityId,
        referred_to:
          oldState.form.suggestion === "R"
            ? oldState.form.referred_to
            : undefined,
        consultation_notes: oldState.form.consultation_notes,
        is_telemedicine: oldState.form.is_telemedicine,
        action: oldState.form.action,
        review_time: oldState.form.review_time,
        assigned_to:
          oldState.form.is_telemedicine === "true"
            ? oldState.form.assigned_to
            : "",
        special_instruction: oldState.form.special_instruction,
        weight: Number(oldState.form.weight),
        height: Number(oldState.form.height),
        bed: bed && bed instanceof Array ? bed[0]?.id : bed?.id,
      };
      const res = await dispatchAction(
        id ? updateConsultation(id, data) : createConsultation(data)
      );
      setIsLoading(false);
      if (res && res.data && res.status !== 400) {
        oldDispatch({ type: "set_form", form: initForm });
        if (id) {
          Notification.Success({
            msg: "Consultation updated successfully",
          });
          navigate(
            `/facility/${facilityId}/patient/${patientId}/consultation/${id}`
          );
        } else {
          Notification.Success({
            msg: "Consultation created successfully",
          });
          navigate(
            `/facility/${facilityId}/patient/${patientId}/consultation/${res.data.id}`
          );
        }
      }
    }
  };

  const handleChange:
    | ChangeEventHandler<HTMLInputElement>
    | ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (e: any) => {
    e &&
      e.target &&
      oldDispatch({
        type: "set_form",
        form: { ...oldState.form, [e.target.name]: e.target.value },
      });
  };

  const handleTelemedicineChange: ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    e &&
      e.target &&
      oldDispatch({
        type: "set_form",
        form: {
          ...oldState.form,
          [e.target.name]: e.target.value,
          action: e.target.value === "false" ? "PENDING" : oldState.form.action,
        },
      });
  };

  const handleDecisionChange = (e: any) => {
    e &&
      e.target &&
      oldDispatch({
        type: "set_form",
        form: {
          ...oldState.form,
          [e.target.name]: e.target.value,
          // admitted: e.target.value === "A" ? "true" : "false",
        },
      });
  };

  const handleSymptomChange = (e: any, child?: any) => {
    const form = { ...oldState.form };
    const { value } = e?.target;
    const otherSymptoms = value.filter((i: number) => i !== 1);
    // prevent user from selecting asymptomatic along with other options
    form.symptoms =
      child?.props?.value === 1
        ? otherSymptoms.length
          ? [1]
          : value
        : otherSymptoms;
    form.hasSymptom = !!form.symptoms.filter((i: number) => i !== 1).length;
    form.otherSymptom = !!form.symptoms.filter((i: number) => i === 9).length;
    oldDispatch({ type: "set_form", form });
  };

  const handleDateChange = (date: MaterialUiPickersDate, key: string) => {
    moment(date).isValid() &&
      oldDispatch({
        type: "set_form",
        form: { ...oldState.form, [key]: date },
      });
  };

  const handleDoctorSelect = (doctor: UserModel | null) => {
    if (doctor?.id) {
      oldDispatch({
        type: "set_form",
        form: {
          ...oldState.form,
          assigned_to: doctor.id.toString(),
          assigned_to_object: doctor,
        },
      });
    } else {
      oldDispatch({
        type: "set_form",
        form: {
          ...oldState.form,
          assigned_to: "",
          assigned_to_object: null,
        },
      });
    }
  };

  const setFacility = (selected: FacilityModel | FacilityModel[] | null) => {
    const selectedFacility = selected as FacilityModel;
    setSelectedFacility(selectedFacility);
    const form: FormDetails = { ...oldState.form };
    if (selectedFacility && selectedFacility.id) {
      form.referred_to = selectedFacility.id.toString() || "";
    }
    oldDispatch({ type: "set_form", form });
  };

  if (isLoading) {
    return <Loading />;
  }

  const handleChangeV2: FormFieldChangeEventHandler = ({ name, value }) =>
    oldDispatch({
      type: "set_form",
      form: { ...oldState.form, [name]: value },
    });

  return (
    <div className="px-2 pb-2 w-full">
      <PageTitle
        title={headerText}
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [patientId]: { name: patientName },
        }}
      />
      <Form className="mt-10 max-w-[51rem] mx-auto" onSubmit={handleSubmit}>
        <div id="symptoms-div">
          <InputLabel id="symptoms-label">Symptoms*</InputLabel>
          <MultiSelectField
            name="symptoms"
            variant="outlined"
            value={oldState.form.symptoms}
            options={symptomChoices}
            onChange={handleSymptomChange}
          />
          <ErrorHelperText error={oldState.errors.symptoms} />
        </div>

        {oldState.form.otherSymptom && (
          <div id="other_symptoms-div">
            <InputLabel id="other-symptoms-label">
              Other Symptom Details
            </InputLabel>
            <MultilineInputField
              rows={5}
              name="other_symptoms"
              variant="outlined"
              margin="dense"
              type="text"
              placeholder="Enter the other symptoms here"
              InputLabelProps={{ shrink: !!oldState.form.other_symptoms }}
              value={oldState.form.other_symptoms}
              onChange={handleChange}
              errors={oldState.errors.other_symptoms}
            />
          </div>
        )}

        {oldState.form.hasSymptom && (
          <div id="symptoms_onset_date-div">
            <DateInputField
              label="Date of onset of the symptoms*"
              value={oldState.form?.symptoms_onset_date}
              onChange={(date) => handleDateChange(date, "symptoms_onset_date")}
              disableFuture={true}
              errors={oldState.errors.symptoms_onset_date}
              InputLabelProps={{ shrink: true }}
            />
          </div>
        )}

        <TextAreaFormField
          id="history_of_present_illness"
          label="History of present illness"
          name="history_of_present_illness"
          placeholder="Information Optional"
          reducerProps={{ state: oldState, dispatch: oldDispatch }}
          value={oldState.form.history_of_present_illness}
          error={oldState.errors.history_of_present_illness}
          onChange={handleChangeV2}
        />

        <TextAreaFormField
          id="examination_details"
          label="Examination details and Clinical conditions"
          name="examination_details"
          placeholder="Information Optional"
          value={oldState.form.examination_details}
          onChange={handleChangeV2}
        />

        <div id="examination_details-div">
          <InputLabel id="exam-details-label">
            Examination details and Clinical conditions
          </InputLabel>
          <MultilineInputField
            rows={5}
            name="examination_details"
            variant="outlined"
            margin="dense"
            type="text"
            placeholder="Information optional"
            InputLabelProps={{
              shrink: !!oldState.form.examination_details,
            }}
            value={oldState.form.examination_details}
            onChange={handleChange}
            errors={oldState.errors.examination_details}
          />
        </div>

        <div id="prescribed_medication-div">
          <InputLabel id="prescribed-medication-label">
            Treatment Plan / Treatment Summary
          </InputLabel>
          <MultilineInputField
            rows={5}
            name="prescribed_medication"
            variant="outlined"
            margin="dense"
            type="text"
            placeholder="Information optional"
            InputLabelProps={{
              shrink: !!oldState.form.prescribed_medication,
            }}
            value={oldState.form.prescribed_medication}
            onChange={handleChange}
            errors={oldState.errors.prescribed_medication}
          />
        </div>
        <div className="flex-1" id="category-div">
          <InputLabel id="category-label" required>
            Category
          </InputLabel>
          <SelectField
            name="category"
            variant="standard"
            value={oldState.form.category}
            options={PATIENT_CATEGORIES.map((c) => {
              return {
                id: c,
                text: c,
              };
            })}
            onChange={handleChange}
            errors={oldState.errors.category}
          />
        </div>

        <div id="suggestion-div">
          <InputLabel
            id="suggestion-label"
            style={{ fontWeight: "bold", fontSize: "18px" }}
          >
            Decision after Consultation*
          </InputLabel>
          <NativeSelectField
            name="suggestion"
            variant="outlined"
            value={oldState.form.suggestion}
            options={suggestionTypes}
            onChange={handleDecisionChange}
          />
          <ErrorHelperText error={oldState.errors.suggestion} />
        </div>

        {oldState.form.suggestion === "R" && (
          <div id="referred_to-div">
            <InputLabel>Referred To Facility</InputLabel>
            <FacilitySelect
              name="referred_to"
              searchAll={true}
              selected={selectedFacility}
              setSelected={setFacility}
              errors={oldState.errors.referred_to}
            />
          </div>
        )}

        {oldState.form.suggestion === "A" && (
          <>
            <div className="flex">
              <div className="flex-1" id="admission_date-div">
                <DateInputField
                  id="admission_date"
                  label="Admission Date*"
                  margin="dense"
                  value={oldState.form.admission_date}
                  disableFuture={true}
                  onChange={(date) => handleDateChange(date, "admission_date")}
                  errors={oldState.errors.admission_date}
                />
              </div>
            </div>
            <div>
              <InputLabel id="asset-type">Bed</InputLabel>
              <BedSelect
                name="bed"
                setSelected={setBed}
                selected={bed}
                errors=""
                multiple={false}
                margin="dense"
                facility={facilityId}
              />
            </div>
          </>
        )}

        <div className="mt-4" id="consultation_notes-div">
          <InputLabel>General Instructions (Advice)*</InputLabel>
          <MultilineInputField
            rows={5}
            className="mt-2"
            name="consultation_notes"
            variant="outlined"
            margin="dense"
            type="text"
            placeholder="Consultation Notes..."
            InputLabelProps={{
              shrink: !!oldState.form.consultation_notes,
            }}
            value={oldState.form.consultation_notes}
            onChange={handleChange}
            errors={oldState.errors.consultation_notes}
          />
        </div>
        <div id="investigation-div" className="mt-4">
          <InputLabel>Investigation Suggestions</InputLabel>
          <InvestigationBuilder
            investigations={InvestigationAdvice}
            setInvestigations={setInvestigationAdvice}
          />
          <br />
          <ErrorHelperText error={oldState.errors.investigation} />
        </div>
        <div id="discharge_advice-div" className="mt-4">
          <InputLabel>Prescription Medication</InputLabel>
          {/*<PrescriptionBuilderOld
                  prescriptions={dischargeAdvice as Prescription__Prescription_t[]}
                  setPrescriptions={setDischargeAdvice}
                />*/}
          <PrescriptionBuilder
            prescriptions={dischargeAdvice}
            setPrescriptions={setDischargeAdvice}
          />
          <br />
          <ErrorHelperText error={oldState.errors.discharge_advice} />
        </div>
        <div id="discharge_advice-div" className="mt-4">
          <InputLabel>PRN Prescription</InputLabel>
          <PRNPrescriptionBuilder
            prescriptions={PRNAdvice}
            setPrescriptions={setPRNAdvice}
          />
          <br />
          <ErrorHelperText error={oldState.errors.prn_prescription} />
        </div>
        <div id="ip-test-_no-div" className="mt-4">
          <TextFormField
            name="ip_no"
            value={oldState.form.ip_no}
            label="IP Number"
            required
            onChange={handleChangeV2}
            error={oldState.errors.ip_no}
            validate={(value) => "some error"}
          />
        </div>
        <div id="ip_no-div" className="mt-4">
          <InputLabel id="refered-label">IP number*</InputLabel>
          <TextInputField
            name="ip_no"
            variant="outlined"
            margin="dense"
            type="string"
            InputLabelProps={{ shrink: !!oldState.form.ip_no }}
            value={oldState.form.ip_no}
            onChange={handleChange}
            errors={oldState.errors.ip_no}
            required
          />
        </div>
        <div id="verified_by-div">
          <InputLabel id="exam-details-label">Verified By</InputLabel>
          <MultilineInputField
            rows={3}
            name="verified_by"
            variant="outlined"
            margin="dense"
            type="text"
            placeholder="Attending Doctors Name and Designation"
            InputLabelProps={{
              shrink: !!oldState.form.verified_by,
            }}
            value={oldState.form.verified_by}
            onChange={handleChange}
            errors={oldState.errors.verified_by}
          />
        </div>
        <div id="diagnosis-div" className="mt-4">
          <InputLabel id="diagnosis-label">Diagnosis</InputLabel>
          <DiagnosisSelect
            name="icd11_diagnoses"
            selected={oldState.form.icd11_diagnoses_object}
            setSelected={(selected: ICD11DiagnosisModel[] | null) => {
              oldDispatch({
                type: "set_form",
                form: {
                  ...oldState.form,
                  icd11_diagnoses:
                    selected?.map(
                      (diagnosis: ICD11DiagnosisModel) => diagnosis.id
                    ) || [],
                },
              });
            }}
          />
        </div>

        {KASP_ENABLED && (
          <div className="flex-1" id="is_kasp-div">
            <InputLabel id="admitted-label">{KASP_STRING}*</InputLabel>
            <RadioGroup
              aria-label="covid"
              name="is_kasp"
              value={oldState.form.is_kasp}
              onChange={handleTelemedicineChange}
              style={{ padding: "0px 5px" }}
            >
              <Box display="flex" flexDirection="row">
                <FormControlLabel
                  value="true"
                  control={<Radio />}
                  label="Yes"
                />
                <FormControlLabel
                  value="false"
                  control={<Radio />}
                  label="No"
                />
              </Box>
            </RadioGroup>
            <ErrorHelperText error={oldState.errors.is_kasp} />
          </div>
        )}
        {/* Telemedicine Fields */}
        <div className="flex mt-4">
          <div className="flex-1" id="is_telemedicine-div">
            <InputLabel id="admitted-label">Telemedicine</InputLabel>
            <RadioGroup
              aria-label="covid"
              name="is_telemedicine"
              value={oldState.form.is_telemedicine}
              onChange={handleTelemedicineChange}
              style={{ padding: "0px 5px" }}
            >
              <Box display="flex" flexDirection="row">
                <FormControlLabel
                  value="true"
                  control={<Radio />}
                  label="Yes"
                />
                <FormControlLabel
                  value="false"
                  control={<Radio />}
                  label="No"
                />
              </Box>
            </RadioGroup>
            <ErrorHelperText error={oldState.errors.is_telemedicine} />
          </div>

          {JSON.parse(oldState.form.is_telemedicine) && (
            <div className="flex-1" id="review_time">
              <InputLabel id="review_time-label">Review After </InputLabel>
              <SelectField
                name="review_time"
                variant="standard"
                value={oldState.form.review_time}
                options={[{ id: "", text: "select" }, ...REVIEW_AT_CHOICES]}
                onChange={handleChange}
                errors={oldState.errors.review_time}
              />
            </div>
          )}
        </div>
        {JSON.parse(oldState.form.is_telemedicine) && (
          <div className="md:col-span-1" id="assigned_to-div">
            <OnlineUsersSelect
              userId={oldState.form.assigned_to}
              selectedUser={oldState.form.assigned_to_object}
              onSelect={handleDoctorSelect}
              user_type={"Doctor"}
              outline={false}
            />
          </div>
        )}
        {JSON.parse(oldState.form.is_telemedicine) && (
          <div id="action-div">
            <InputLabel
              id="action-label"
              style={{ fontWeight: "bold", fontSize: "18px" }}
            >
              Action
            </InputLabel>
            <NativeSelectField
              name="action"
              variant="outlined"
              value={oldState.form.action}
              optionKey="text"
              optionValue="desc"
              options={TELEMEDICINE_ACTIONS}
              onChange={handleChange}
            />
            <ErrorHelperText error={oldState.errors.action} />
          </div>
        )}
        <div id="special_instruction-div" className="mt-2">
          <InputLabel id="special-instruction-label">
            Special Instructions
          </InputLabel>
          <MultilineInputField
            rows={5}
            name="special_instruction"
            variant="outlined"
            margin="dense"
            type="text"
            placeholder="Information optional"
            InputLabelProps={{
              shrink: !!oldState.form.special_instruction,
            }}
            value={oldState.form.special_instruction}
            onChange={handleChange}
            errors={oldState.errors.special_instruction}
          />
        </div>

        <div className="flex flex-col md:flex-row justify-between md:gap-5 mt-4">
          <div id="weight-div" className="flex-1">
            <InputLabel id="refered-label">Weight (in Kg)</InputLabel>
            <TextInputField
              name="weight"
              variant="outlined"
              margin="dense"
              type="number"
              InputLabelProps={{ shrink: !!oldState.form.weight }}
              value={oldState.form.weight}
              onChange={handleChange}
              errors={oldState.errors.weight}
            />
          </div>
          <div id="height-div" className="flex-1">
            <InputLabel id="refered-label">Height (in cm)</InputLabel>
            <TextInputField
              name="height"
              variant="outlined"
              margin="dense"
              type="number"
              InputLabelProps={{ shrink: !!oldState.form.height }}
              value={oldState.form.height}
              onChange={handleChange}
              errors={oldState.errors.height}
            />
          </div>
        </div>
        <div id="body_surface-div" className="flex-1">
          Body Surface area :{" "}
          {Math.sqrt(
            (Number(oldState.form.weight) * Number(oldState.form.height)) / 3600
          ).toFixed(2)}{" "}
          m<sup>2</sup>
        </div>
        {/* End of Telemedicine fields */}
        <div className="mt-4 flex justify-between">
          <Button
            color="default"
            variant="contained"
            type="button"
            onClick={() =>
              navigate(`/facility/${facilityId}/patient/${patientId}`)
            }
          >
            Cancel{" "}
          </Button>
          <Button
            color="primary"
            variant="contained"
            type="submit"
            style={{ marginLeft: "auto" }}
            startIcon={<CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>}
            onClick={(e) => handleSubmit(e)}
          >
            {buttonText}
          </Button>
        </div>
      </Form>
      {!id ? null : (
        <div className="mt-4 bg-white rounded shadow p-4">
          <h3>Update Bed</h3>
          <CardContent>
            <Beds
              facilityId={facilityId}
              patientId={patientId}
              consultationId={id}
            ></Beds>
          </CardContent>
        </div>
      )}
    </div>
  );
};
