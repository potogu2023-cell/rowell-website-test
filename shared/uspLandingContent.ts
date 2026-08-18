export interface USPLandingProfile {
  code: string;
  name: string;
  heading: string;
  summary: string;
  overview: string;
  selectionPoints: string[];
  faq: Array<{ question: string; answer: string }>;
}

const methodEvaluationNotice = "An L-code identifies a stationary-phase classification. It does not establish USP approval, certification, or automatic suitability as a replacement in a specific method. Confirm the complete method, exact part number, dimensions, operating limits, and system-suitability requirements before use.";

export const USP_LANDING_PROFILES: Record<string, USPLandingProfile> = {
  l1: {
    code: "L1",
    name: "Octadecylsilane (C18)",
    heading: "USP L1 C18 Column Classification for Method Evaluation",
    summary: "Browse active catalog products recorded with the USP L1 octadecylsilane (C18) stationary-phase classification and compare exact product specifications before method evaluation.",
    overview: "L1 is used for octadecylsilane (C18) stationary-phase classification. It can help laboratory teams begin a catalog search when reviewing reversed-phase methods, but the classification alone does not determine chromatographic equivalence. Compare the exact part number, dimensions, particle size, pore size, hardware, and manufacturer-stated operating limits with the complete method.",
    selectionPoints: [
      "Use the L1 classification as a catalog-discovery starting point, then compare the exact stationary phase and product documentation.",
      "Match internal diameter, column length, particle size, and pore size with the existing method and instrument limits.",
      "Check the active product type and exact part number: catalog results can include analytical columns, guards, or sample-preparation products."
    ],
    faq: [
      { question: "What does USP L1 describe?", answer: "L1 is the USP stationary-phase classification used for octadecylsilane (C18). It is a classification aid, not a product approval or method-transfer conclusion." },
      { question: "Can any L1 product replace a C18 column in a validated method?", answer: methodEvaluationNotice },
      { question: "Which details should be checked after finding an L1 product?", answer: "Check the exact part number, stationary-phase description, dimensions, particle size, pore size, hardware format, operating limits, and the method’s own suitability criteria." }
    ]
  },
  l7: {
    code: "L7",
    name: "Octylsilane (C8)",
    heading: "USP L7 C8 Column Classification for Method Evaluation",
    summary: "Browse active catalog products recorded with the USP L7 octylsilane (C8) stationary-phase classification and compare exact specifications for method review.",
    overview: "L7 is used for octylsilane (C8) stationary-phase classification. It provides a precise catalog filter for laboratories reviewing a C8 phase, while final product selection remains a method-level decision. Confirm the exact manufacturer-stated chemistry and operating conditions instead of assuming that all C8 products behave identically.",
    selectionPoints: [
      "Compare the documented C8 chemistry with the analytical objective and the existing method conditions.",
      "Review dimensions, particle size, pore size, pressure limits, and compatible hardware for the selected part number.",
      "Verify method performance under the intended conditions before changing a validated workflow."
    ],
    faq: [
      { question: "What does USP L7 describe?", answer: "L7 is the USP stationary-phase classification used for octylsilane (C8). It helps narrow a catalog search but does not certify a specific product for a method." },
      { question: "Are all C8 products interchangeable?", answer: "No. Bonding chemistry, hardware, dimensions, particle size, and documented operating limits can differ. Use the exact product documentation and method-suitability criteria." },
      { question: "Can an L7 product be selected only by its L-code?", answer: methodEvaluationNotice }
    ]
  },
  l11: {
    code: "L11",
    name: "Phenylsilane",
    heading: "USP L11 Phenyl Column Classification for Method Evaluation",
    summary: "Browse active catalog products recorded with the USP L11 phenylsilane stationary-phase classification and compare exact product details for analytical method review.",
    overview: "L11 is used for phenylsilane stationary-phase classification. It can support catalog discovery when a method team is evaluating phenyl-type selectivity, but individual product chemistry and chromatographic behavior may differ. The exact product documentation and method evidence should guide a final selection.",
    selectionPoints: [
      "Confirm the exact phenyl chemistry named in the product documentation before comparing products.",
      "Review dimensions, particle size, pore size, and operating limits against the intended system and method.",
      "Evaluate changes to stationary phase using actual method conditions and predefined suitability criteria."
    ],
    faq: [
      { question: "What does USP L11 describe?", answer: "L11 is the USP stationary-phase classification used for phenylsilane. It is useful for catalog organization and does not by itself confirm method suitability." },
      { question: "Does the L11 classification prove equivalent selectivity?", answer: methodEvaluationNotice },
      { question: "What should be compared for a phenyl-phase review?", answer: "Compare the exact phase description, dimensions, particle and pore size, hardware, operating limits, analyte and matrix conditions, and method-suitability results." }
    ]
  },
  l43: {
    code: "L43",
    name: "Pentafluorophenyl (PFP)",
    heading: "USP L43 PFP Column Classification for Method Evaluation",
    summary: "Browse active catalog products recorded with the USP L43 pentafluorophenyl (PFP) stationary-phase classification and compare exact specifications for method evaluation.",
    overview: "L43 is used for pentafluorophenyl (PFP) stationary-phase classification. It gives laboratories a direct route to catalog products recorded with this classification when reviewing an alternative selectivity option. The L-code does not establish that a product will reproduce another product’s separation; the exact phase, dimensions, operating conditions, and system-suitability evidence must be reviewed.",
    selectionPoints: [
      "Use L43 to identify candidate products, then confirm the exact PFP chemistry and manufacturer documentation for each part number.",
      "Compare particle size, pore size, internal diameter, length, and documented operating limits with the current method.",
      "Treat a stationary-phase change as a method-evaluation activity and verify system suitability under the intended conditions."
    ],
    faq: [
      { question: "What does USP L43 describe?", answer: "L43 is the USP stationary-phase classification used for pentafluorophenyl (PFP) chemistry. It supports catalog discovery and is not a certification or replacement claim." },
      { question: "Can a PFP product be substituted for a C18 product without method work?", answer: "No. A stationary-phase change can alter retention and selectivity. Evaluate the exact product under the actual method conditions and acceptance criteria." },
      { question: "Why use the L43 page?", answer: "The page provides a focused route to active catalog products recorded with L43, then directs the user to compare exact product specifications before requesting a quote or beginning method work." }
    ]
  },
  l60: {
    code: "L60",
    name: "HILIC",
    heading: "USP L60 HILIC Column Classification for Method Evaluation",
    summary: "Browse active catalog products recorded with the USP L60 HILIC stationary-phase classification and compare exact product documentation for polar-analyte method review.",
    overview: "L60 is used for HILIC stationary-phase classification. It can be used as a catalog-discovery filter when a method calls for polar-analyte retention behavior, but individual HILIC products differ in stationary-phase chemistry and documented operating conditions. Final selection should be based on the selected part number and the complete method.",
    selectionPoints: [
      "Review the exact stationary phase and manufacturer guidance before selecting mobile-phase conditions.",
      "Compare dimensions, particle size, pore size, and instrument pressure limits with the intended method scale.",
      "Confirm equilibration, sample-solvent, and system-suitability requirements for the selected product and workflow."
    ],
    faq: [
      { question: "What does USP L60 describe?", answer: "L60 is the USP stationary-phase classification used for HILIC. It is an information and discovery aid, not a method approval or equivalence statement." },
      { question: "Do all L60 products use the same method conditions?", answer: "No. Stationary-phase chemistry and manufacturer-stated conditions can differ by product. Review the exact part number before choosing solvents, additives, or operating parameters." },
      { question: "Can an L60 classification confirm a method transfer?", answer: methodEvaluationNotice }
    ]
  }
};

export const USP_LANDING_CODES = Object.keys(USP_LANDING_PROFILES);
