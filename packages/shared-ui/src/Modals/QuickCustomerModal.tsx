import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
// import type { UseFormRegister } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomerType } from "@monorepo/shared-types";
import { useTranslation } from "react-i18next";
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
} from "@monorepo/shared-ui";
import { Button } from "@monorepo/shared-ui";
import { Input } from "@monorepo/shared-ui";
import { Text } from "@monorepo/shared-ui";
import { Select } from "@monorepo/shared-ui";

type QuickCustomerModalProps = {
  onClose: () => void;
  onSave: (formData: FormData) => void;
  isLoading?: boolean;
};

type FormValues = {
  first: string;
  last: string;
  mobile: string;
  gender?: string;
  firstAr?: string;
  nationalId?: string;
};

// Code generation function
const generateCustomerCode = (): string => {
  const timestamp = Date.now().toString(); // Last 6 digits of timestamp
  const random = Math.random().toString(36).substring(2, 5).toUpperCase(); // 3 random characters
  return `CUST-${timestamp}-${random}`;
};

// type Name = keyof FormValues;

const QuickCustomerModal: React.FC<QuickCustomerModalProps> = ({
  onClose,
  onSave,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [generatedCode] = useState<string>(generateCustomerCode());

  const formSchema = z.object({
    first: z.string().min(1, t("first_name_required")),
    last: z.string().min(1, t("last_name_required")),
    mobile: z.string().min(1, t("mobile_required")),
    gender: z.string().optional(),
    firstAr: z.string().optional(),
    nationalId: z
      .string()
      .length(14, t("national_id_length_error"))
      .optional()
      .or(z.literal("")),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    criteriaMode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: {
      first: "",
      last: "",
      mobile: "",
      gender: "",
      firstAr: "",
      nationalId: "",
    },
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const onSubmit = async (values: FormValues) => {
    if (isLoading) return;
    const form = new FormData();
    form.append("CustomerType", String(CustomerType.Individual));
    form.append("code", generatedCode);
    form.append("nationality", "EG");
    form.append("mobile", values.mobile.trim());
    if (values.first?.trim()) form.append("first", values.first.trim());
    if (values.last?.trim()) form.append("last", values.last.trim());
    if ((values.gender || "").trim())
      form.append("gender", (values.gender || "").trim());
    if ((values.firstAr || "").trim())
      form.append("firstAr", (values.firstAr || "").trim());
    if ((values.nationalId || "").trim())
      form.append("nationalId", (values.nationalId || "").trim());
    await Promise.resolve(onSave(form) as unknown as Promise<void>);
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="md">
      <ModalHeader>
        <Text variant="h3" color="dark" weight="semibold">
          {t("create_customer")}
        </Text>
      </ModalHeader>

      <form onSubmit={handleSubmit(onSubmit)} aria-busy={isLoading}>
        <ModalContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t("first_name_label")}
                placeholder={t("first_name_placeholder")}
                disabled={isLoading}
                error={errors.first?.message}
                required={true}
                {...register("first")}
              />
              <Input
                label={t("last_name_label")}
                placeholder={t("last_name_placeholder")}
                disabled={isLoading}
                error={errors.last?.message}
                required={true}
                {...register("last")}
              />
            </div>

            <Input
              label={t("mobile_label")}
              type="tel"
              placeholder={t("mobile_placeholder")}
              disabled={isLoading}
              error={errors.mobile?.message}
              required={true}
              {...register("mobile")}
            />

            <Input
              label={t("national_id_label")}
              type="text"
              placeholder={t("national_id_placeholder")}
              disabled={isLoading}
              error={errors.nationalId?.message}
              {...register("nationalId")}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label={t("gender_label")}
                disabled={isLoading}
                {...register("gender")}
                options={[
                  { value: "", label: t("select_option") },
                  { value: "male", label: t("male_option") },
                  { value: "female", label: t("female_option") },
                ]}
              />
              <Input
                label={t("first_name_ar_label")}
                placeholder={t("first_name_ar_placeholder")}
                disabled={isLoading}
                {...register("firstAr")}
              />
            </div>
          </div>
        </ModalContent>

        <ModalFooter>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              fullWidth
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isValid || isLoading}
              isLoading={isLoading}
              loadingText={t("saving")}
              fullWidth
            >
              {t("save_customer")}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export { QuickCustomerModal };
