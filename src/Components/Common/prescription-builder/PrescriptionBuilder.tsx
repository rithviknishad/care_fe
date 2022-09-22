import { PrescriptionDropdown } from "./PrescriptionDropdown";
import { PrescriptionBuilderProps } from "./PRNPrescriptionBuilder";

export const medicines = require("./assets/medicines");

const frequency = ["od", "hs", "bd", "tid", "qid", "q4h", "qod", "qwk"];
const frequencyTips = {
  od: "once daily",
  hs: "Night only",
  bd: "Twice daily",
  tid: "8th hourly",
  qid: "6th hourly",
  q4h: "4th hourly",
  qod: "Alternate day",
  qwk: "Once a week",
};
export const routes = ["Oral", "IV", "IM", "S/C"];
export const units = ["mg", "ml", "drops", "ampule", "tsp"];

export type PrescriptionType = {
  medicine?: string;
  route?: string;
  dosage?: string; // is now frequency
  dosage_new?: string;
  days?: number;
  notes?: string;
};

export const emptyValues = {
  medicine: "",
  route: "",
  dosage: "",
  dosage_new: "0 mg",
  days: 0,
  notes: "",
};

export default function PrescriptionBuilder(
  props: PrescriptionBuilderProps<PrescriptionType>
) {
  const { prescriptions, setPrescriptions } = props;

  const setItem = (object: PrescriptionType, i: number) => {
    setPrescriptions(
      prescriptions.map((prescription, index) =>
        index === i ? object : prescription
      )
    );
  };

  return (
    <div className="mt-2">
      {prescriptions.map((prescription, i) => {
        const setMedicine = (medicine: string) => {
          setItem(
            {
              ...prescription,
              medicine,
            },
            i
          );
        };

        const setRoute = (route: string) => {
          setItem(
            {
              ...prescription,
              route,
            },
            i
          );
        };

        const setFrequency = (frequency: string) => {
          setItem(
            {
              ...prescription,
              dosage: frequency,
            },
            i
          );
        };

        const setDosageUnit = (unit: string) => {
          setItem(
            {
              ...prescription,
              dosage_new: prescription.dosage_new
                ? prescription.dosage_new.split(" ")[0] + " " + unit
                : "0 mg",
            },
            i
          );
        };

        return (
          <div
            key={i}
            className="border-b border-b-gray-500 border-dashed py-2 text-xs text-gray-600"
          >
            <div className="flex gap-2 flex-col md:flex-row">
              <div className="w-full">
                Medicine
                <PrescriptionDropdown
                  placeholder="Medicine"
                  options={medicines}
                  value={prescription.medicine || ""}
                  setValue={setMedicine}
                />
              </div>
              <div className="flex gap-2">
                <div>
                  Route
                  <PrescriptionDropdown
                    placeholder="Route"
                    options={routes}
                    value={prescription.route || ""}
                    setValue={setRoute}
                  />
                </div>
                <div>
                  Frequency
                  <PrescriptionDropdown
                    placeholder="Frequency"
                    options={frequency}
                    tips={frequencyTips}
                    value={prescription.dosage || ""}
                    setValue={setFrequency}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-2 flex-col md:flex-row">
              <div className="w-full md:w-[260px] flex gap-2 shrink-0">
                <div>
                  Dosage
                  <div className="flex gap-1">
                    <input
                      type="number"
                      className="w-full focus:ring-primary-500 focus:border-primary-500 block border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
                      value={prescription.dosage_new?.split(" ")[0]}
                      placeholder="Dosage"
                      min={0}
                      onChange={(e) => {
                        let value = parseFloat(e.target.value);
                        if (value < 0) {
                          value = 0;
                        }
                        setItem(
                          {
                            ...prescription,
                            dosage_new:
                              value +
                              " " +
                              (prescription.dosage_new?.split(" ")[1] || "mg"),
                          },
                          i
                        );
                      }}
                      required
                    />
                    <div className="w-[80px] shrink-0">
                      <PrescriptionDropdown
                        placeholder="Unit"
                        options={units}
                        value={prescription.dosage_new?.split(" ")[1] || "mg"}
                        setValue={setDosageUnit}
                      />
                    </div>
                  </div>
                </div>

                <div className="w-[70px] shrink-0">
                  Days
                  <input
                    type="number"
                    className="border w-full focus:ring-primary-500 focus:border-primary-500 block border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
                    value={prescription.days}
                    placeholder="Days"
                    min={0}
                    onChange={(e) => {
                      let value = parseInt(e.target.value);
                      if (value < 0) {
                        value = 0;
                      }
                      setItem(
                        {
                          ...prescription,
                          days: value,
                        },
                        i
                      );
                    }}
                    required
                  />
                </div>
              </div>

              <div className="w-full">
                Notes
                <input
                  type="text"
                  className="border w-full focus:ring-primary-500 focus:border-primary-500 block border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
                  value={prescription.notes}
                  placeholder="Notes"
                  onChange={(e) => {
                    setItem(
                      {
                        ...prescription,
                        notes: e.target.value,
                      },
                      i
                    );
                  }}
                />
              </div>

              <button
                type="button"
                className="text-gray-400 text-base transition hover:text-red-500"
                onClick={() => {
                  setPrescriptions(
                    prescriptions.filter((prescription, index) => i != index)
                  );
                }}
              >
                <i className="fas fa-trash" />
              </button>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => {
          setPrescriptions([...prescriptions, emptyValues]);
        }}
        className="shadow-sm mt-4 bg-gray-200 w-full font-bold block px-4 py-2 text-sm leading-5 text-left text-gray-700 hover:bg-gray-300 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900"
      >
        + Add Medicine
      </button>
    </div>
  );
}
