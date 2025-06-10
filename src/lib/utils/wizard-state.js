// src/lib/utils/wizard-state.js (REVERTED - NO RUNES)
import { writable, derived } from "svelte/store";

export const WIZARD_STEPS = [
	{ id: 1, name: "Kontaktinformationen", icon: "👤" },
	{ id: 2, name: "Empfänger", icon: "📮" },
	{ id: 3, name: "Rechnungsdetails", icon: "📄" },
	{ id: 4, name: "Positionen", icon: "📋" },
	{ id: 5, name: "Abschluss", icon: "✓" }
];

// Wizard navigation state
export const currentStep = writable(1);
export const totalSteps = WIZARD_STEPS.length;

// UI state
export const uiState = writable({
	showXml: false,
	validationErrors: [],
	isDownloading: false,
	showSuccess: false,
	showPremiumModal: false,
	showRegistrationModal: false,
	selectedFormat: "CII"
});

// Premium state
export const premiumState = writable({
	userTier: "free", // 'free' | 'premium'
	monthlyInvoices: 0,
	premiumFeature: ""
});

// Derived stores
export const canGoNext = derived(
	[currentStep, uiState],
	([$currentStep, $uiState]) => {
		return $currentStep < totalSteps && $uiState.validationErrors.length === 0;
	}
);

export const canGoPrev = derived(
	[currentStep, uiState],
	([$currentStep, $uiState]) =>
		$currentStep > 1 && $uiState.validationErrors.length === 0
);

// Navigation actions
export const wizardActions = {
	nextStep() {
		currentStep.update((step) => Math.min(step + 1, totalSteps));
	},

	prevStep() {
		currentStep.update((step) => Math.max(step - 1, 1));
	},

	goToStep(step) {
		if (step >= 1 && step <= totalSteps) {
			currentStep.set(step);
		}
	},

	resetWizard() {
		currentStep.set(1);
		uiState.update((state) => ({
			...state,
			validationErrors: [],
			isDownloading: false,
			showSuccess: false
		}));
	}
};

// UI actions
export const uiActions = {
	setValidationErrors(errors) {
		uiState.update((state) => ({ ...state, validationErrors: errors }));
	},

	setDownloading(downloading) {
		uiState.update((state) => ({ ...state, isDownloading: downloading }));
	},

	setShowSuccess(show) {
		uiState.update((state) => ({ ...state, showSuccess: show }));
	},

	toggleXmlView() {
		uiState.update((state) => ({ ...state, showXml: !state.showXml }));
	},

	setSelectedFormat(format) {
		uiState.update((state) => ({ ...state, selectedFormat: format }));
	}
};

// Premium actions
export const premiumActions = {
	showPremiumUpgrade(feature) {
		premiumState.update((state) => ({ ...state, premiumFeature: feature }));
		uiState.update((state) => ({ ...state, showPremiumModal: true }));
	},

	hidePremiumModal() {
		uiState.update((state) => ({ ...state, showPremiumModal: false }));
	}
};
