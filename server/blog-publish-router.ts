import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { adminProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { resources } from "../drizzle/schema";

const PUBLISH_CONFIRMATION = "PUBLISH_ROWELL_NOV_2026";

const BLOGS = [
  {
    slug: "pfas-testing-water-food-sample-preparation-calibration-standards",
    title: "PFAS Testing in Water and Food: Sample Preparation and Calibration Planning",
    excerpt: "A practical, evidence-led framework for planning PFAS sample preparation, contamination control, LC-MS/MS analysis, and calibration standards.",
    category: "Technical Guides",
    tags: ["PFAS", "LC-MS/MS", "Sample Preparation", "Calibration Standards", "Environmental Analysis"],
    content: `# PFAS Testing in Water and Food: Sample Preparation and Calibration Planning

Per- and polyfluoroalkyl substances (PFAS) analysis is not a single-product decision. A defensible workflow connects the regulatory or project objective, the sample matrix, contamination-control plan, extraction procedure, LC-MS/MS configuration, and calibration strategy. This guide is an educational planning resource; it is not a substitute for a current approved method, laboratory accreditation requirements, or method-specific quality-control procedures.

## Start with the intended method and matrix

The first question is what decision the data must support. For drinking-water compliance work, laboratories should begin with the applicable authority and the current method version. The U.S. Environmental Protection Agency identifies Methods 533, 537, and 537.1 as drinking-water methods supporting analysis of defined PFAS compounds, and notes that approved methods depend on the regulatory context.[1]

Water, food, soil, and other complex matrices can place different demands on preparation. Record the sample type, expected concentration range, solids or lipid content, preservation requirements, and reporting objective before choosing a cartridge or consumable. A cartridge listed for one matrix should not be treated as universal evidence for another.

## Treat contamination control as part of sample preparation

PFAS work requires a deliberate materials review. Before a batch begins, document contact materials, tubing, containers, filters, solvents, laboratory clothing, and cleaning procedures that could introduce fluorinated background. Include procedural blanks, equipment blanks, field blanks, and laboratory-control samples where required by the governing method or project plan. The goal is not to assume that a material is acceptable because it is common in another analytical workflow; it is to verify the material against the method and laboratory experience.

Sample preparation should also preserve traceability. Record sample receipt, storage, preparation date, extraction batch, internal standards, dilution, and any deviation from the written procedure. This information is essential when a result is questioned or when a laboratory compares batches over time.

## Choose SPE by documented chemistry and workflow needs

Many PFAS workflows use solid-phase extraction before LC-MS/MS. The correct phase, format, bed mass, and elution plan depend on the analyte group, sample volume, matrix load, and validated method. Thermo Fisher describes sample pretreatment, conditioning, sample application, washing, and elution as connected SPE steps rather than independent product choices.[2]

Use the exact manufacturer documentation and method instructions for conditioning and elution. Do not infer recovery, selectivity, or matrix-effect performance from a product name, a photograph, or a general phase label. If the laboratory is screening a new cartridge, compare it with the incumbent workflow using representative samples, blanks, spikes, and predefined acceptance criteria.

## Build calibration and quality control around the reporting purpose

Calibration levels should cover the intended reporting range and be prepared with traceable standards appropriate to the analytes and method. Define the role of isotopically labelled internal standards, continuing calibration checks, laboratory blanks, matrix spikes, duplicates, and laboratory-control samples before the sequence is started. A calibration curve that looks acceptable in solvent does not by itself demonstrate acceptable behavior in a complex food or environmental matrix.

When a result is near a decision limit, review dilution, internal-standard response, blank contribution, carryover, and qualifier-ion behavior according to the method. If the method is modified, document the change and evaluate whether precision, accuracy, selectivity, and detection capability remain fit for the stated purpose.

## A practical procurement checklist

Before requesting a technical quotation, provide the exact method or project reference, matrix, target analyte list, sample volume, extraction format, cartridge chemistry and size under consideration, required standards, and any restrictions on contact materials. This lets the catalog record be reviewed against a real workflow rather than a generic PFAS keyword.

ROWELL’s [SPE cartridge collection](/categories/spe-cartridges) and [reference standards library](/standards) can support catalog discovery. Final selection and method use remain subject to the laboratory’s approved procedure and manufacturer documentation.

> This article is educational information. It does not claim regulatory approval, guaranteed recovery, detection limits, compatibility, or supply status for any product.

## References

[1] [U.S. EPA, EPA PFAS Drinking Water Laboratory Methods](https://www.epa.gov/pfas/epa-pfas-drinking-water-laboratory-methods)

[2] [Thermo Fisher Scientific, Solid Phase Extraction Guide](https://www.thermofisher.com/us/en/home/industrial/chromatography/chromatography-sample-preparation/sample-preparation-consumables/solid-phase-extraction-consumables/spe-guide.html)
`,
  },
  {
    slug: "c18-spe-cartridge-selection-bed-mass-reservoir-volume-method-development",
    title: "C18 SPE Cartridge Selection: Bed Mass, Reservoir Volume, and Method Development",
    excerpt: "How to compare C18 SPE cartridge formats by sample load, sorbent mass, solvent handling, and method-development evidence without overclaiming performance.",
    category: "Technical Guides",
    tags: ["C18 SPE", "Solid Phase Extraction", "Sample Preparation", "Method Development"],
    content: `# C18 SPE Cartridge Selection: Bed Mass, Reservoir Volume, and Method Development

C18 SPE cartridges are often selected by habit: a familiar bed mass, a familiar barrel size, or a familiar brand. A more defensible approach starts with the sample, analyte, solvent system, and intended workflow. Bed mass and reservoir volume affect handling, but neither one alone proves recovery, capacity, or method suitability.

## Separate the three sizing questions

When comparing cartridge formats, keep three questions separate:

1. **How much sorbent is needed?** This relates to analyte load, matrix load, retention mechanism, and the method’s capacity evidence.
2. **How much liquid must the cartridge hold?** This relates to sample volume, conditioning, wash, and elution steps.
3. **How will the laboratory process the batch?** This includes manifold capacity, vacuum or positive-pressure control, evaporation, throughput, and waste handling.

Thermo Fisher’s SPE guide explains that cartridge size should be considered alongside sample volume, sorbent amount, solvent use, extraction speed, and capacity requirements.[1] These are planning variables, not a universal recipe for every C18 method.

## Bed mass is a starting variable, not a performance guarantee

A larger bed mass may provide more sorbent and may be useful when the sample contains more matrix or when the method requires a greater working capacity. It can also increase solvent consumption and evaporation workload. A smaller bed mass may reduce solvent use and be practical for lower-volume workflows, but the laboratory still needs evidence that retention and cleanup remain acceptable.

Use the manufacturer’s documented capacity information where available. If the analyte load, matrix composition, or solvent conditions differ from the published context, perform a local comparison. Record the cartridge identity, conditioning sequence, sample volume, flow control, wash, elution volume, and acceptance criteria so that the experiment can be reproduced.

## Reservoir volume affects the physical workflow

Reservoir volume is a handling constraint. The cartridge must accommodate the sample and the required preparation steps without overflow, excessive transfers, or uncontrolled flow. It should also fit the selected manifold, collection vessel, and waste system.

A larger barrel does not automatically improve chromatographic cleanup. Conversely, a smaller barrel is not automatically more efficient. The right format is the one that supports the validated solvent volumes, sample load, operator workflow, and throughput of the method.

## A controlled C18 screening sequence

For a new method, define the analyte and matrix first. Then compare a small number of documented C18 formats under the same sample preparation and measurement plan. Monitor blank contribution, retention, elution behavior, matrix effect, repeatability, and practical handling. If the laboratory changes bed mass or cartridge geometry, treat that as a method-development change and confirm the relevant performance characteristics again.

Thermo Fisher describes the core SPE sequence as sample pretreatment, conditioning, re-equilibration, sample application, washing, and elution.[1] The guide also emphasizes that the sorbent should not be allowed to dry during the relevant conditioning steps and that flow rate can influence extraction consistency. These operational details should be written into the laboratory procedure rather than left to informal practice.

## Use recorded catalog information carefully

A catalog matrix can help a team compare listed part numbers, bed masses, and formats. It cannot replace the original manufacturer specification or establish that two products are equivalent. Review the exact part number, brand, phase description, format, and evidence before making a selection.

ROWELL’s [recorded HyperSep C18 matrix](/products/matrix/hypersep-c18), [recorded Bond Elut C18 matrix](/products/matrix/bond-elut-c18), and [recorded BAKERBOND C18 matrix](/products/matrix/bakerbond-c18) are intended for catalog orientation. Confirm the current manufacturer documentation and local method evidence before use.

## Procurement checklist

For an efficient technical inquiry, provide the sample matrix, analyte class, approximate sample volume, expected concentration range, intended cartridge format, available manifold, solvent restrictions, and any existing method or acceptance criteria. This makes it possible to review a specific catalog record instead of making a generic C18 recommendation.

> This article is educational information. It does not assert guaranteed recovery, capacity, compatibility, equivalence, replacement status, or availability for any product.

## Reference

[1] [Thermo Fisher Scientific, Solid Phase Extraction Guide](https://www.thermofisher.com/us/en/home/industrial/chromatography/chromatography-sample-preparation/sample-preparation-consumables/solid-phase-extraction-consumables/spe-guide.html)
`,
  },
  {
    slug: "hplc-consumables-sample-preparation-qc-selection-checklist",
    title: "Choosing HPLC Consumables for Reliable Sample Preparation and Routine QC",
    excerpt: "A practical checklist for aligning filters, vials, caps, syringes, tubing, fittings, and standards with the analytical method and routine QC workflow.",
    category: "Technical Guides",
    tags: ["HPLC Consumables", "Sample Preparation", "Routine QC", "Laboratory Procurement"],
    content: `# Choosing HPLC Consumables for Reliable Sample Preparation and Routine QC

Routine quality-control work depends on more than the column and detector. Filters, vials, caps, septa, syringes, tubing, fittings, and reference standards all sit inside the sample or solvent workflow. A consumable that is chemically unsuitable, dimensionally incorrect, poorly documented, or inconsistent with the instrument can create avoidable variation.

## Begin with the method record

Before choosing a consumable, capture the method’s sample solvent, analyte concentration, filtration requirement, injection volume, vial format, closure type, instrument model, pressure range, and any material restrictions. Also record whether the workflow is manual, autosampler-based, LC-MS, UV, GC, or another configuration.

This information narrows the decision more reliably than a product category alone. For example, a syringe used for manual injection should not be assumed to fit an autosampler simply because the nominal volume is similar. Needle geometry, gauge, length, termination, and plunger design can all matter.

## Treat filtration as a method variable

Filter selection should consider membrane material, pore size, chemical compatibility, housing format, sample volume, and the possibility of analyte adsorption or extractables. A smaller pore size is not automatically better if it increases pressure, slows processing, or interacts with the sample. The method should define whether filtration is required and how the laboratory verifies that the filter does not change the reported result.

For particulate-heavy samples, filtration may protect the instrument and column, but the filter itself becomes part of the sample-preparation system. Record the filter lot, material, pore size, pre-rinse or discard volume where applicable, and any observed recovery or blank behavior required by the procedure.

## Match vials and closures to the workflow

Vial and closure choices should be made together. Confirm vial volume, glass or polymer material, neck and cap format, septum material, solvent exposure, temperature, and autosampler compatibility. A closure that seals well for one solvent system may not be appropriate for another. A vial that fits the tray mechanically may still be unsuitable if the insert, septum, or residual volume does not match the method.

Use the instrument documentation and manufacturer specifications to verify the complete vial-and-closure assembly. Do not infer compatibility from appearance or from a similar catalog photograph.

## Review tubing and fittings as part of the flow path

Tubing and fittings influence connection integrity, dead volume, pressure capability, solvent compatibility, and serviceability. Record the tubing outside and inside dimensions, length, material, port or thread style, and the pressure conditions of the system. A fitting must match the tubing and port geometry; similar-looking parts are not necessarily interchangeable.

When a connection is changed, check for leaks, pressure behavior, peak-shape effects, carryover, and the possibility of added extra-column volume. Keep the approved connection specification with the instrument or method record so that routine maintenance does not create undocumented variation.

## Use standards and consumables with the same discipline

Reference standards should be selected by identity, grade, certificate information, analyte, concentration, storage, expiry, and intended use. The standard record should be linked to the preparation calculation and the analytical sequence. A consumable or standard should not be described as certified, traceable, or suitable for a regulated purpose unless the relevant documentation supports that statement.

For routine procurement, maintain a controlled list of approved part numbers and the evidence used to approve them. When a supplier or manufacturer changes a product, review the new documentation rather than assuming that the replacement is identical.

## A practical QC purchasing checklist

Before requesting a quotation, provide the instrument or module, method name, sample solvent, sample volume, injection mode, filter requirements, vial and closure format, tubing and fitting dimensions, required standard identity, and any quality-document requirements. This allows a technical review to focus on the actual workflow and prevents selection based only on a generic category name.

ROWELL’s [vials collection](/categories/vials), [caps and septa collection](/categories/caps-septa), [syringes collection](/categories/syringes), and [fittings and tubing collection](/categories/fittings-tubing) provide catalog starting points. Product-specific specifications and the laboratory’s approved method remain the controlling evidence.

> This article is educational information. It does not promise performance, stock, delivery, certification, compatibility, equivalence, or regulatory acceptance for any product.

## Further reading

For broader sample-preparation planning, see the [C18 SPE selection guide](/guides/c18-spe-cartridge-selection). For a product inquiry, provide the exact part number and the method details needed for a technical review.
`,
  },
] as const;

const publishInput = z.object({
  confirmation: z.literal(PUBLISH_CONFIRMATION),
  slugs: z.array(z.string()).length(BLOGS.length),
});

export const blogPublishRouter = router({
  publishNovemberBatch: adminProcedure
    .input((raw: unknown) => publishInput.parse(raw))
    .mutation(async ({ input }) => {
      const expectedSlugs = BLOGS.map(article => article.slug);
      if (input.slugs.slice().sort().join("|") !== expectedSlugs.slice().sort().join("|")) {
        throw new Error("The requested batch does not match the reviewed three-article set.");
      }

      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const publishedAt = new Date().toISOString().slice(0, 19).replace("T", " ");

      return db.transaction(async tx => {
        const existing = await tx
          .select({ slug: resources.slug })
          .from(resources)
          .where(inArray(resources.slug, expectedSlugs));
        if (existing.length > 0) {
          throw new Error(`Refusing to overwrite existing resource slug(s): ${existing.map(row => row.slug).join(", ")}`);
        }

        const rows = BLOGS.map(article => ({
          title: article.title,
          slug: article.slug,
          content: article.content,
          excerpt: article.excerpt,
          category: article.category,
          author: "ROWELL Technical Editorial Team",
          publishedAt,
          tags: [...article.tags],
          status: "published",
          views: 0,
          createdAt: publishedAt,
          updatedAt: publishedAt,
        }));
        await tx.insert(resources).values(rows);
        return { published: expectedSlugs, publishedAt };
      });
    }),
});

export const reviewedNovemberBlogs = BLOGS.map(({ slug, title }) => ({ slug, title }));
