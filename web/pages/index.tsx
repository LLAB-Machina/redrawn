import HomePage from "@/components/pages/HomePage";
import { DEFAULT_LANGUAGE } from "@/i18n/constants";
import { withLanguage } from "@/utils/withLanguage";

export default withLanguage(HomePage, DEFAULT_LANGUAGE);
