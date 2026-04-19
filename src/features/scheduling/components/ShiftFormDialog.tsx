import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useForm } from "react-hook-form";
import { dateToKey } from "@/features/calendar/utils/dateKeys";
import { RESTAURANT_ZONE_OPTIONS } from "@/features/employees/constants/labels";
import {
  createShift,
  updateShift,
} from "@/features/scheduling/services/shiftsService";
import {
  formValuesToShiftRange,
  shiftFormSchema,
  type ShiftFormValues,
} from "@/features/scheduling/validation/shiftSchemas";
import type { Employee, Shift } from "@/shared/types/entities";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Select } from "@/shared/components/ui/Select";
import { Textarea } from "@/shared/components/ui/Textarea";

const ZONE_OPTIONS_DIALOG = [
  { value: "", label: "Implicit (zonă angajat)" },
  ...RESTAURANT_ZONE_OPTIONS,
];

function shiftToFormValues(shift: Shift): ShiftFormValues {
  const start = shift.startAt?.toDate();
  const end = shift.endAt?.toDate();
  if (!start || !end) {
    return defaultFormValues(new Date());
  }
  return {
    employeeId: shift.employeeId,
    dateKey: dateToKey(start),
    startTime: format(start, "HH:mm"),
    endTime: format(end, "HH:mm"),
    zone: shift.zone ?? "",
    notes: shift.notes ?? "",
  };
}

function defaultFormValues(day: Date): ShiftFormValues {
  return {
    employeeId: "",
    dateKey: dateToKey(day),
    startTime: "10:00",
    endTime: "18:00",
    zone: "",
    notes: "",
  };
}

type ShiftFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  shift: Shift | null;
  initialDay: Date;
  employees: Employee[];
  organizationId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
};

export function ShiftFormDialog({
  open,
  mode,
  shift,
  initialDay,
  employees,
  organizationId,
  userId,
  onClose,
  onSaved,
}: ShiftFormDialogProps) {
  const listForSelect = employees.filter(
    (e) => e.isActive || (mode === "edit" && shift?.employeeId === e.id),
  );
  const employeeOptions = [
    { value: "", label: "— Alege angajatul —" },
    ...listForSelect.map((e) => ({
      value: e.id,
      label: e.isActive ? e.fullName : `${e.fullName} (inactiv)`,
    })),
  ];

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: defaultFormValues(initialDay),
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && shift) {
      reset(shiftToFormValues(shift));
    } else {
      reset(defaultFormValues(initialDay));
    }
  }, [open, mode, shift, initialDay, reset]);

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setFormError(null);
  }, [open]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const range = formValuesToShiftRange(values);
    if (!range) {
      setFormError("Nu am putut calcula intervalul schimbului.");
      return;
    }
    const zone = values.zone === "" ? undefined : values.zone;
    const notes = values.notes?.trim() || undefined;
    try {
      if (mode === "create") {
        await createShift({
          organizationId,
          employeeId: values.employeeId,
          startAt: range.start,
          endAt: range.end,
          zone,
          notes,
          createdBy: userId,
        });
      } else if (shift) {
        await updateShift(shift.id, {
          employeeId: values.employeeId,
          startAt: range.start,
          endAt: range.end,
          zone,
          notes,
        });
      }
      onSaved();
      onClose();
    } catch {
      setFormError(
        "Salvarea a eșuat. Verifică conexiunea și regulile Firestore pentru colecția shifts.",
      );
    }
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isSubmitting, onClose]);

  if (!open) return null;

  const title = mode === "create" ? "Schimb nou" : "Editare schimb";

  return createPortal(
    <div className="zs-modal-root" role="presentation">
      <div
        className="zs-modal-root__backdrop"
        aria-hidden
        onClick={() => !isSubmitting && onClose()}
      />
      <div
        className="zs-modal zs-modal--schedule"
        role="dialog"
        aria-modal="true"
        aria-labelledby="zs-shift-dialog-title"
      >
        <h2 id="zs-shift-dialog-title" className="zs-modal__title">
          {title}
        </h2>
        <div className="zs-modal__body">
          <form className="zs-schedule-form" onSubmit={(e) => void onSubmit(e)}>
            {employeeOptions.length === 0 ? (
              <p className="zs-muted">
                Nu există angajați. Adaugă angajați în modulul Angajați.
              </p>
            ) : (
              <Controller
                name="employeeId"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Angajat"
                    options={employeeOptions}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.employeeId?.message}
                  />
                )}
              />
            )}

            <Input
              label="Zi"
              type="date"
              error={errors.dateKey?.message}
              {...register("dateKey")}
            />

            <div className="zs-schedule-form__row">
              <Input
                label="Început"
                type="time"
                error={errors.startTime?.message}
                {...register("startTime")}
              />
              <Input
                label="Sfârșit"
                type="time"
                error={errors.endTime?.message}
                {...register("endTime")}
              />
            </div>

            <Controller
              name="zone"
              control={control}
              render={({ field }) => (
                <Select
                  label="Zonă (opțional)"
                  options={ZONE_OPTIONS_DIALOG}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.zone?.message}
                />
              )}
            />

            <Textarea
              label="Notițe (opțional)"
              rows={3}
              error={errors.notes?.message}
              {...register("notes")}
            />

            {formError ? (
              <p className="zs-error zs-modal-error" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="zs-modal__footer zs-schedule-form__footer">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Anulează
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={employeeOptions.length === 0}
              >
                Salvează
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
