// Answer key source: the ORIGINAL GROQ behind every function the Supabase port must reproduce.
//
// Every query string below is copied verbatim from src/lib/sanity-queries.js (function
// queries) or from the API routes (inline route lookups) as of commit 08aba3e4.
// `node tests/parity/check-queries.mjs` re-checks that each string still appears verbatim
// in its source file, so drift in the originals is caught.
//
// Each FUNCTIONS entry reproduces the original function body around its query: the
// early returns (`if (!email) return null`), JS-side parameter shaping
// (`email.toLowerCase()`), and JS post-processing (getDataRoomFundPerformance's sort).
// `fetch(query, params)` is injected: groq-js in tests/parity/engine.mjs, or a real
// @sanity/client for read-only probes.

export const Q = {
  getLPFundSettings: `*[_type == "lpFundSettings"][0]{
      fundName,
      fundManagerName,
      fundManagerDescriptor,
      tagline,
      firstCloseDate,
      finalCloseDate,
      fundSizeAtClose,
      targetFundSizeINR,
      targetFundSizeUSD,
      investmentStrategy,
      focusSectors[]->{
        _id,
        name,
        "slug": slug.current
      },
      investorRelationsEmail,
      additionalContacts,
      website,
      "logoLight": logoLight.asset->url,
      "logoDark": logoDark.asset->url,
      // Quarterly performance array
      quarterlyPerformance[] {
        quarter,
        fiscalYear,
        amountDrawnDown,
        totalInvested,
        fairMarketValue,
        amountReturned,
        moic,
        tvpi,
        dpi,
        rvpi
      }
    }`,
  getLPInvestments: `*[_type == "company" && investmentStatus in ["active", "exited"] && showOnPartnerPortal != false] | order(order asc) {
      _id,
      name,
      entityName,
      "slug": slug.current,
      oneLiner,
      detail,
      aboutCompany,
      isRevenueMaking,
      "logo": logo.asset->url,
      link,
      "sector": category->name,
      "sectorSlug": category->slug.current,
      investmentStatus,
      exitDate,
      showExitEarlyInReport,
      order,
      // Investment rounds with all data
      "investmentRounds": investmentRounds[] | order(investmentDate asc) {
        isInitialRound,
        isYaliLead,
        showEarlyInReport,
        roundName,
        roundLabel,
        investmentDate,
        preMoneyValuation,
        totalRoundSize,
        postMoneyValuation,
        yaliInvestment,
        yaliOwnership,
        "coInvestors": coInvestors[]{
          "displayOrder": displayOrder,
          "_id": select(_type == "reference" => @->_id, investor->_id),
          "name": select(_type == "reference" => @->name, investor->name),
          "type": select(_type == "reference" => @->type, investor->type)
        }
      },
      "quarterlyUpdates": quarterlyUpdates[] | order(fiscalYear desc, quarter desc) {
        quarter,
        fiscalYear,
        // Confidential data filtered at source - values are null when confidential
        "currentFMV": select(currentFMVConfidential == true => null, currentFMV),
        currentFMVConfidential,
        "currentOwnershipPercent": select(currentOwnershipConfidential == true => null, currentOwnershipPercent),
        currentOwnershipConfidential,
        "amountReturned": select(amountReturnedConfidential == true => null, amountReturned),
        amountReturnedConfidential,
        "multipleOfInvestment": select(moicConfidential == true => null, multipleOfInvestment),
        moicConfidential,
        "roundMoics": select(moicConfidential == true => null, roundMoics),
        tableFootnotes,
        updateNotes,
        "revenueINR": select(revenueConfidential == true => null, revenueINR),
        revenueConfidential,
        "patINR": select(patConfidential == true => null, patINR),
        patConfidential,
        "teamSize": select(teamSizeConfidential == true => null, teamSize),
        teamSizeConfidential,
        keyMetrics
      },
      "latestQuarter": quarterlyUpdates[] | order(fiscalYear desc, quarter desc)[0] {
        quarter,
        fiscalYear,
        "currentFMV": select(currentFMVConfidential == true => null, currentFMV),
        currentFMVConfidential,
        "currentOwnershipPercent": select(currentOwnershipConfidential == true => null, currentOwnershipPercent),
        currentOwnershipConfidential,
        "amountReturned": select(amountReturnedConfidential == true => null, amountReturned),
        amountReturnedConfidential,
        "multipleOfInvestment": select(moicConfidential == true => null, multipleOfInvestment),
        moicConfidential,
        "roundMoics": select(moicConfidential == true => null, roundMoics),
        tableFootnotes,
        updateNotes,
        "revenueINR": select(revenueConfidential == true => null, revenueINR),
        revenueConfidential,
        "patINR": select(patConfidential == true => null, patINR),
        patConfidential,
        "teamSize": select(teamSizeConfidential == true => null, teamSize),
        teamSizeConfidential,
        keyMetrics
      }
    }`,
  getLPInvestmentsForPdf: `*[_type == "company" && investmentStatus in ["active", "exited"] && showOnPartnerPortal != false] | order(order asc) {
      _id,
      name,
      entityName,
      "slug": slug.current,
      oneLiner,
      detail,
      aboutCompany,
      isRevenueMaking,
      "logo": logo.asset->url,
      link,
      "sector": category->name,
      "sectorSlug": category->slug.current,
      investmentStatus,
      exitDate,
      showExitEarlyInReport,
      order,
      "investmentRounds": investmentRounds[] | order(investmentDate asc) {
        isInitialRound,
        isYaliLead,
        showEarlyInReport,
        roundName,
        roundLabel,
        investmentDate,
        preMoneyValuation,
        totalRoundSize,
        postMoneyValuation,
        yaliInvestment,
        yaliOwnership,
        "coInvestors": coInvestors[]{
          "displayOrder": displayOrder,
          "_id": select(_type == "reference" => @->_id, investor->_id),
          "name": select(_type == "reference" => @->name, investor->name),
          "type": select(_type == "reference" => @->type, investor->type)
        }
      },
      "quarterlyUpdates": quarterlyUpdates[] | order(fiscalYear desc, quarter desc) {
        quarter,
        fiscalYear,
        "currentFMV": select(currentFMVConfidential == true => null, currentFMV),
        currentFMVConfidential,
        "currentOwnershipPercent": select(currentOwnershipConfidential == true => null, currentOwnershipPercent),
        currentOwnershipConfidential,
        "amountReturned": select(amountReturnedConfidential == true => null, amountReturned),
        amountReturnedConfidential,
        "multipleOfInvestment": select(moicConfidential == true => null, multipleOfInvestment),
        moicConfidential,
        tableFootnotes,
        updateNotes,
        "revenueINR": select(revenueConfidential == true => null, revenueINR),
        revenueConfidential,
        "patINR": select(patConfidential == true => null, patINR),
        patConfidential,
        "teamSize": select(teamSizeConfidential == true => null, teamSize),
        teamSizeConfidential,
        keyMetrics,
        "roundMoics": select(moicConfidential == true => null, roundMoics)
      },
      "latestQuarter": quarterlyUpdates[] | order(fiscalYear desc, quarter desc)[0] {
        quarter,
        fiscalYear,
        "currentFMV": select(currentFMVConfidential == true => null, currentFMV),
        "currentOwnershipPercent": select(currentOwnershipConfidential == true => null, currentOwnershipPercent),
        "amountReturned": select(amountReturnedConfidential == true => null, amountReturned),
        "multipleOfInvestment": select(moicConfidential == true => null, multipleOfInvestment),
        tableFootnotes,
        updateNotes,
        "revenueINR": select(revenueConfidential == true => null, revenueINR),
        "patINR": select(patConfidential == true => null, patINR),
        "teamSize": select(teamSizeConfidential == true => null, teamSize),
        teamSizeConfidential,
        keyMetrics,
        "roundMoics": select(moicConfidential == true => null, roundMoics)
      }
    }`,
  getLPInvestmentByCompanySlug: `*[_type == "company" && slug.current == $companySlug && investmentStatus in ["active", "exited"] && showOnPartnerPortal != false][0]{
      _id,
      name,
      entityName,
      "slug": slug.current,
      oneLiner,
      detail,
      aboutCompany,
      isRevenueMaking,
      "logo": logo.asset->url,
      "logomarkTypeface": logomarkTypeface.asset->url,
      link,
      "sector": category->name,
      investmentDate,
      fundingRound,
      preMoneyValuation,
      totalRoundSize,
      postMoneyValuation,
      yaliInvestmentAmount,
      yaliOwnershipPercent,
      coInvestors,
      investmentStatus,
      exitDate,
      showExitEarlyInReport,
      "investmentRounds": investmentRounds[] | order(investmentDate asc) {
        isInitialRound,
        isYaliLead,
        showEarlyInReport,
        roundName,
        roundLabel,
        investmentDate,
        preMoneyValuation,
        totalRoundSize,
        postMoneyValuation,
        yaliInvestment,
        yaliOwnership,
        "coInvestors": coInvestors[]{
          "_id": select(_type == "reference" => @->_id, investor->_id),
          "name": select(_type == "reference" => @->name, investor->name),
          "type": select(_type == "reference" => @->type, investor->type),
          "logo": select(_type == "reference" => @->logo.asset->url, investor->logo.asset->url),
          "displayOrder": select(_type == "coInvestorEntry" => displayOrder, null)
        }
      },
      "quarterlyUpdates": quarterlyUpdates[] | order(fiscalYear desc, quarter desc) {
        quarter,
        fiscalYear,
        // Confidential data filtered at source
        "currentFMV": select(currentFMVConfidential == true => null, currentFMV),
        currentFMVConfidential,
        "currentOwnershipPercent": select(currentOwnershipConfidential == true => null, currentOwnershipPercent),
        currentOwnershipConfidential,
        "amountReturned": select(amountReturnedConfidential == true => null, amountReturned),
        amountReturnedConfidential,
        "multipleOfInvestment": select(moicConfidential == true => null, multipleOfInvestment),
        moicConfidential,
        "roundMoics": select(moicConfidential == true => null, roundMoics),
        tableFootnotes,
        updateNotes,
        "revenueINR": select(revenueConfidential == true => null, revenueINR),
        revenueConfidential,
        "patINR": select(patConfidential == true => null, patINR),
        patConfidential,
        "teamSize": select(teamSizeConfidential == true => null, teamSize),
        teamSizeConfidential,
        keyMetrics
      },
      "latestQuarter": quarterlyUpdates[] | order(fiscalYear desc, quarter desc)[0] {
        quarter,
        fiscalYear,
        // Confidential data filtered at source
        "currentFMV": select(currentFMVConfidential == true => null, currentFMV),
        currentFMVConfidential,
        "currentOwnershipPercent": select(currentOwnershipConfidential == true => null, currentOwnershipPercent),
        currentOwnershipConfidential,
        "amountReturned": select(amountReturnedConfidential == true => null, amountReturned),
        amountReturnedConfidential,
        "multipleOfInvestment": select(moicConfidential == true => null, multipleOfInvestment),
        moicConfidential,
        "roundMoics": select(moicConfidential == true => null, roundMoics),
        tableFootnotes,
        updateNotes,
        "revenueINR": select(revenueConfidential == true => null, revenueINR),
        revenueConfidential,
        "patINR": select(patConfidential == true => null, patINR),
        patConfidential,
        "teamSize": select(teamSizeConfidential == true => null, teamSize),
        teamSizeConfidential,
        keyMetrics
      }
    }`,
  getLPQuarterUpdates: `*[_type == "company" && investmentStatus in ["active", "exited"] && showOnPartnerPortal != false && count(quarterlyUpdates[quarter == $quarter && fiscalYear == $fiscalYear]) > 0] | order(order asc) {
      _id,
      name,
      "slug": slug.current,
      "logo": logo.asset->url,
      "sector": category->name,
      investmentDate,
      fundingRound,
      yaliInvestmentAmount,
      yaliOwnershipPercent,
      coInvestors,
      "quarterUpdate": quarterlyUpdates[quarter == $quarter && fiscalYear == $fiscalYear][0] {
        quarter,
        fiscalYear,
        // Confidential data filtered at source
        "currentFMV": select(currentFMVConfidential == true => null, currentFMV),
        currentFMVConfidential,
        "currentOwnershipPercent": select(currentOwnershipConfidential == true => null, currentOwnershipPercent),
        currentOwnershipConfidential,
        "amountReturned": select(amountReturnedConfidential == true => null, amountReturned),
        amountReturnedConfidential,
        "multipleOfInvestment": select(moicConfidential == true => null, multipleOfInvestment),
        moicConfidential,
        updateNotes,
        "revenueINR": select(revenueConfidential == true => null, revenueINR),
        revenueConfidential,
        "patINR": select(patConfidential == true => null, patINR),
        patConfidential,
        "teamSize": select(teamSizeConfidential == true => null, teamSize),
        teamSizeConfidential,
        keyMetrics
      }
    }`,
  getLPQuarterlyReportBySlug: `*[_type == "lpQuarterlyReport" && slug.current == $slug && (visibility in ["internal", "published"] || (isPublished == true && !defined(visibility)))][0]{
      _id,
      title,
      "slug": slug.current,
      quarter,
      fiscalYear,
      reportingDate,
      publishDate,
      "visibility": coalesce(visibility, select(isPublished == true => "published", "draft")),
      // Cover Note (text/narrative only)
      coverNoteGreeting,
      coverNoteIntro,
      investmentActivityNotes,
      portfolioHighlightsNotes,
      ecosystemNotes,
      closingNotes,
      "signatory": signatory->{
        _id,
        name,
        slug,
        role,
        profileType,
        "photo": photo.asset->url
      },
      "pdfUrl": generatedPdf.asset->url,
      "fundFinancialsPdfUrl": fundFinancialsPdf.asset->url,
      "giftCityFundFinancialsPdfUrl": giftCityFundFinancialsPdf.asset->url,
      // Pipeline (references)
      "pipelineDeals": pipelineDeals[]->{
        _id,
        companyName,
        "sector": coalesce(sector->name, sectorOverride),
        proposedAmountINR,
        stage,
        description
      },
      pipelineNotes,
      // Media (references only)
      "mediaFromNews": mediaFromNews[]->{
        _id,
        headlineEdited,
        date,
        url,
        "publicationName": publication->name
      },
      mediaNotes,
      mediaFeature,
      // Portfolio Summary table footnotes
      portfolioSummaryFootnotes,
      // Fund summary table footnotes
      fundSummaryFootnotes
    }`,
  getLPQuarterlyReportBySlugAdmin: `*[_type == "lpQuarterlyReport" && slug.current == $slug][0]{
      _id,
      title,
      subtitle,
      "slug": slug.current,
      quarter,
      fiscalYear,
      reportingDate,
      publishDate,
      coverNoteGreeting,
      coverNoteIntro,
      investmentActivityNotes,
      portfolioHighlightsNotes,
      ecosystemNotes,
      closingNotes,
      "signatory": signatory->{
        _id,
        name,
        slug,
        role,
        profileType,
        "photo": photo.asset->url
      },
      "pipelineDeals": pipelineDeals[]->{
        _id,
        companyName,
        "sector": coalesce(sector->name, sectorOverride),
        proposedAmountINR,
        stage,
        description
      },
      pipelineNotes,
      "mediaFromNews": mediaFromNews[]->{
        _id,
        headlineEdited,
        date,
        url,
        "publicationName": publication->name
      },
      mediaNotes,
      mediaFeature,
      portfolioSummaryFootnotes,
      fundSummaryFootnotes,
      snapshotData,
      snapshotTimestamp
    }`,
  getAllLPInvestmentSlugs: `*[_type == "company" && investmentStatus in ["active", "exited"] && showOnPartnerPortal != false] | order(order asc, name asc) {
      "slug": slug.current,
      name,
      "logo": logo.asset->url,
      investmentStatus,
      exitDate,
      showExitEarlyInReport,
      "investmentRounds": investmentRounds[] | order(investmentDate asc) {
        isInitialRound,
        investmentDate
      },
      // Periods only — getPortfolioCompaniesForQuarter needs them for its "has an update" gate
      "quarterlyUpdates": quarterlyUpdates[]{ quarter, fiscalYear }
    }`,
  getAvailableLPQuarters: `*[_type == "lpQuarterlyReport" && (visibility in ["internal", "published"] || (isPublished == true && !defined(visibility)))] | order(fiscalYear desc, quarter desc) {
      _id,
      title,
      "slug": slug.current,
      quarter,
      fiscalYear,
      publishDate,
      "visibility": coalesce(visibility, select(isPublished == true => "published", "draft")),
      "pdfUrl": generatedPdf.asset->url
    }`,
  getPortalUserByEmail: `*[_type == "portalUser" && lower(email) == $email && noAccess != true && (lpPortalAccess == true || (!defined(lpPortalAccess) && isActive == true))][0]{
      _id,
      email,
      name,
      isGiftCityLP,
      lpPortalAccess,
      investorDataRoomAccess
    }`,
  getLatestLPReportForDataRoom: `*[_type == "lpQuarterlyReport" && (visibility == "published" || (isPublished == true && !defined(visibility)))] | order(fiscalYear desc, quarter desc)[0] {
      _id,
      title,
      quarter,
      fiscalYear,
      "pdfUrl": generatedPdf.asset->url
    }`,
  getDataroomDomainPrivilege: `*[_type == "domainPrivilege" && domain == $domain && dataroomAccess == true && isActive == true][0]{ _id }`,
  getDataroomFundContent: `*[_type == "dataroomFundContent"][0] {
      "fundISlideDeckUrl": fundISlideDeck.asset->url,
      "fundILpReport": *[_id == ^.fundILpReport._ref && (visibility == "published" || (isPublished == true && !defined(visibility)))][0]{
        _id,
        title,
        quarter,
        fiscalYear,
        "pdfUrl": generatedPdf.asset->url
      },
      "fundIIThesisPresentationUrl": fundIIThesisPresentation.asset->url,
      commonTeamMembers[]->{
        _id,
        name,
        "slug": slug.current
      },
      "commonTrackRecordUrl": commonTrackRecord.asset->url,
      commonRecommendationDocuments[]{
        title,
        "fileUrl": file.asset->url
      },
      exitValueAsOfDate,
      hiddenFunds
    }`,
  getDataRoomDocuments: `*[_type == "dataRoomDocument" && accessLevel == "data-room"] | order(category asc, publishedAt desc) {
      _id,
      title,
      category,
      description,
      publishedAt,
      "fileUrl": file.asset->url,
      "fileName": file.asset->originalFilename
    }`,
  getDataRoomTrackRecords: `*[_type == "trackRecord"] | order(investor->name asc, year desc) {
      _id,
      investeeName,
      investmentOrg,
      year,
      sector,
      amountInvested,
      status,
      exitYear,
      exitAmountOrValuation,
      irr,
      "investorName": investor->name
    }`,
  getDataRoomFundPerformance: `*[_type == "lpFundSettings"][0]{
      quarterlyPerformance[] {
        quarter,
        fiscalYear,
        amountDrawnDown,
        totalInvested,
        fairMarketValue,
        amountReturned,
        moic,
        tvpi,
        dpi,
        rvpi
      }
    }`,
  getDataRoomPortfolioCompanies: `*[_type == "company" && investmentStatus == "active"] | order(order asc) {
      _id,
      name,
      "slug": slug.current,
      oneLiner,
      "logo": logo.asset->url,
      "sector": category->name,
      "sectorSlug": category->slug.current,
      investmentStatus,
      isRevenueMaking,
      "investmentRounds": investmentRounds[] | order(investmentDate asc) {
        roundName,
        roundLabel,
        investmentDate,
        yaliInvestment,
        isInitialRound
      },
      "latestQuarter": quarterlyUpdates[] | order(fiscalYear desc, quarter desc)[0] {
        quarter,
        fiscalYear,
        "currentFMV": select(currentFMVConfidential == true => null, currentFMV),
        currentFMVConfidential,
        "multipleOfInvestment": select(moicConfidential == true => null, multipleOfInvestment),
        moicConfidential,
        "revenueINR": select(revenueConfidential == true => null, revenueINR),
        revenueConfidential,
        "teamSize": select(teamSizeConfidential == true => null, teamSize),
        teamSizeConfidential
      }
    }`,
  getDataRoomAllFundSettings: `*[_type == "lpFundSettings"][0]{
      fundName,
      fundSizeAtClose,
      targetFundSizeINR,
      firstCloseDate,
      finalCloseDate,
      quarterlyPerformance[] {
        quarter,
        fiscalYear,
        amountDrawnDown,
        totalInvested,
        fairMarketValue,
        amountReturned,
        moic,
        tvpi,
        dpi,
        rvpi
      }
    }`,
};

// getLatestLPQuarterlyReport builds its filter in JS; these are the two original fragments
// and the original template, reproduced exactly.
export const LATEST_VISIBILITY_FILTER = {
  internal: '(visibility in ["internal", "published"] || (isPublished == true && !defined(visibility)))',
  published: '(visibility == "published" || (isPublished == true && !defined(visibility)))',
};
export function latestLPQuarterlyReportQuery(includeInternal = false) {
  const visibilityFilter = includeInternal ? LATEST_VISIBILITY_FILTER.internal : LATEST_VISIBILITY_FILTER.published;
  return `*[_type == "lpQuarterlyReport" && ${visibilityFilter}] | order(fiscalYear desc, quarter desc)[0] {
      _id,
      title,
      "slug": slug.current,
      quarter,
      fiscalYear,
      reportingDate,
      publishDate,
      "visibility": coalesce(visibility, select(isPublished == true => "published", "draft")),
      "pdfUrl": generatedPdf.asset->url
    }`;
}

// Inline lookups in the 7 API routes (verbatim). The names are this answer key's own;
// the port may name them differently (run-cases.mjs takes --alias ours=theirs).
// All of them receive an already-normalised value: the routes do
// `email.toLowerCase().trim()` and `domain = normalizedEmail.split('@')[1]` (check-domain:
// `searchParams.get('domain')?.toLowerCase().trim()`, and skips the query when empty).
export const ROUTE_Q = {
  // src/app/api/portal-auth/route.js, action send-code
  portalAuthDomainPrivilege: `*[_type == "domainPrivilege" && domain == $domain && lpPortalAccess == true && isActive == true][0]{
          _id, requireCode, inviteCode, codeExpiry, maxUses, usedCount
        }`,
  // portal-auth and dataroom-auth, send-code (trusted domain) and verify-code path 0
  blockedPortalUser: `*[_type == "portalUser" && lower(email) == $email && noAccess == true][0]{ _id }`,
  // portal-auth send-code (non-trusted domain)
  portalAuthUser: `*[_type == "portalUser" && lower(email) == $email && noAccess != true && (lpPortalAccess == true || (!defined(lpPortalAccess) && isActive == true))][0]{ _id, name }`,
  // portal-auth verify-code, path 0 (domain shared code)
  portalAuthDomainSharedCode: `*[_type == "domainPrivilege" && domain == $domain && lpPortalAccess == true && requireCode == true && isActive == true][0]{
            _id, inviteCode, codeExpiry, maxUses, usedCount, redemptionLog
          }`,
  // portal-auth verify-code, path B (per-user invite code)
  portalAuthInviteUser: `*[_type == "portalUser" && lower(email) == $email && noAccess != true && (lpPortalAccess == true || (!defined(lpPortalAccess) && isActive == true))][0]{
            _id, inviteCode, inviteCodeExpiry
          }`,
  // src/app/api/dataroom-auth/route.js, send-code
  dataroomAuthDomainPrivilege: `*[_type == "domainPrivilege" && domain == $domain && dataroomAccess == true && isActive == true][0]{
          _id, requireCode, inviteCode, codeExpiry, maxUses, usedCount
        }`,
  dataroomAuthUser: `*[_type == "portalUser" && lower(email) == $email && noAccess != true && (investorDataRoomAccess == true || (dataRoomAccess == true && !defined(investorDataRoomAccess)))][0]{ _id, name }`,
  dataroomAuthDomainSharedCode: `*[_type == "domainPrivilege" && domain == $domain && dataroomAccess == true && requireCode == true && isActive == true][0]{
            _id, inviteCode, codeExpiry, maxUses, usedCount, redemptionLog
          }`,
  dataroomAuthInviteUser: `*[_type == "portalUser" && lower(email) == $email && noAccess != true && (investorDataRoomAccess == true || (dataRoomAccess == true && !defined(investorDataRoomAccess)))][0]{
            _id, inviteCode, inviteCodeExpiry
          }`,
  // src/app/api/portal-invite/route.js hasPortalAccess(email)
  portalInviteAccess: `*[_type == "portalUser" && lower(email) == $email && noAccess != true && (lpPortalAccess == true || (!defined(lpPortalAccess) && isActive == true))][0]{ _id }`,
  // src/app/api/dataroom-invite/route.js hasDataroomAccess(email)
  dataroomInviteAccess: `*[_type == "portalUser" && lower(email) == $email && noAccess != true && (investorDataRoomAccess == true || (dataRoomAccess == true && !defined(investorDataRoomAccess)))][0]{ _id }`,
  // src/app/api/check-domain/route.js
  checkDomainShared: `*[_type == "domainPrivilege" && domain == $domain && requireCode == true && isActive == true][0]{ _id }`,
};

// Writes in the routes (not read cases; listed so the port's write path can be checked by hand / by C2):
// - portal-auth + dataroom-auth verify-code path 0: patch(domainPriv._id).set({ usedCount: (usedCount || 0) + 1,
//   redemptionLog: [...existingLog, { _key: 16 hex, email: normalizedEmail, redeemedAt: ISO }] })
// - portal-auth + dataroom-auth verify-code path B: patch(user._id).unset(['inviteCode', 'inviteCodeExpiry'])
// - portal-feedback: create({ _type: 'lpPortalFeedback', email, npsScore: parseInt(npsScore, 10) (0..10),
//   reportQuarter: reportQuarter || null, feedbackDetails: feedbackDetails || null, submittedAt: ISO })
// - portal-download: create({ _type: 'lpDownloadConsent', email, downloadType, reportQuarter: reportQuarter || null,
//   fileName: fileName || null, consentedAt: ISO, ipAddress: first x-forwarded-for entry trimmed || x-real-ip || null })
export const WRITES = ['domainPrivilegeRedeem', 'portalUserClearInvite', 'lpPortalFeedbackCreate', 'lpDownloadConsentCreate'];

// Which file-URL prefix the contract assigns to each function's output.
const PORTAL = 'portal';
const DATAROOM = 'dataroom';

// The original function bodies around the queries. `fetch(query, params)` returns the GROQ result.
export const FUNCTIONS = {
  getLPFundSettings: { surface: PORTAL, run: (fetch) => fetch(Q.getLPFundSettings) },
  getLPInvestments: { surface: PORTAL, run: (fetch) => fetch(Q.getLPInvestments) },
  getLPInvestmentsForPdf: { surface: PORTAL, run: (fetch) => fetch(Q.getLPInvestmentsForPdf) },
  getLPInvestmentByCompanySlug: {
    surface: PORTAL,
    run: (fetch, companySlug) => fetch(Q.getLPInvestmentByCompanySlug, { companySlug }),
  },
  getLPQuarterUpdates: {
    surface: PORTAL,
    run: (fetch, quarter, fiscalYear) => fetch(Q.getLPQuarterUpdates, { quarter, fiscalYear }),
  },
  getLPQuarterlyReportBySlug: { surface: PORTAL, run: (fetch, slug) => fetch(Q.getLPQuarterlyReportBySlug, { slug }) },
  getLPQuarterlyReportBySlugAdmin: {
    surface: PORTAL,
    run: (fetch, slug) => fetch(Q.getLPQuarterlyReportBySlugAdmin, { slug }),
  },
  getLatestLPQuarterlyReport: {
    surface: PORTAL,
    // original signature: (includeInternal = false)
    run: (fetch, ...args) => {
      const includeInternal = args.length === 0 || args[0] === undefined ? false : args[0];
      return fetch(latestLPQuarterlyReportQuery(includeInternal));
    },
  },
  getAllLPInvestmentSlugs: { surface: PORTAL, run: (fetch) => fetch(Q.getAllLPInvestmentSlugs) },
  getAvailableLPQuarters: { surface: PORTAL, run: (fetch) => fetch(Q.getAvailableLPQuarters) },
  getPortalUserByEmail: {
    surface: PORTAL,
    run: async (fetch, email) => {
      if (!email) return null;
      return fetch(Q.getPortalUserByEmail, { email: email.toLowerCase() });
    },
  },
  getLatestLPReportForDataRoom: { surface: DATAROOM, run: (fetch) => fetch(Q.getLatestLPReportForDataRoom) },
  getDataroomDomainPrivilege: {
    surface: DATAROOM,
    run: async (fetch, domain) => {
      if (!domain) return null;
      return fetch(Q.getDataroomDomainPrivilege, { domain });
    },
  },
  getDataroomFundContent: { surface: DATAROOM, run: (fetch) => fetch(Q.getDataroomFundContent) },
  getDataRoomDocuments: { surface: DATAROOM, run: (fetch) => fetch(Q.getDataRoomDocuments) },
  getDataRoomTrackRecords: { surface: DATAROOM, run: (fetch) => fetch(Q.getDataRoomTrackRecords) },
  getDataRoomFundPerformance: {
    surface: DATAROOM,
    // Post-processing copied exactly from the original (including that it throws a TypeError
    // when an entry has no fiscalYear and the array has 2+ entries).
    run: async (fetch) => {
      const settings = await fetch(Q.getDataRoomFundPerformance);
      if (!settings?.quarterlyPerformance?.length) return null;
      // Sort descending by FY then quarter to get the most recent
      const fyOrder = (fy) => parseInt(fy.replace('FY', ''), 10);
      const qOrder = { Q4: 4, Q3: 3, Q2: 2, Q1: 1 };
      const sorted = [...settings.quarterlyPerformance].sort((a, b) => {
        const fyDiff = fyOrder(b.fiscalYear) - fyOrder(a.fiscalYear);
        if (fyDiff !== 0) return fyDiff;
        return (qOrder[b.quarter] || 0) - (qOrder[a.quarter] || 0);
      });
      return sorted[0];
    },
  },
  getDataRoomPortfolioCompanies: { surface: DATAROOM, run: (fetch) => fetch(Q.getDataRoomPortfolioCompanies) },
  getDataRoomAllFundSettings: { surface: DATAROOM, run: (fetch) => fetch(Q.getDataRoomAllFundSettings) },

  // ---- inline route lookups (input = the already-normalised value the route passes) ----
  portalAuthDomainPrivilege: { surface: PORTAL, route: true, kind: 'domain', run: (fetch, domain) => fetch(ROUTE_Q.portalAuthDomainPrivilege, { domain }) },
  portalAuthDomainSharedCode: { surface: PORTAL, route: true, kind: 'domain', run: (fetch, domain) => fetch(ROUTE_Q.portalAuthDomainSharedCode, { domain }) },
  blockedPortalUser: { surface: PORTAL, route: true, kind: 'email', run: (fetch, email) => fetch(ROUTE_Q.blockedPortalUser, { email }) },
  portalAuthUser: { surface: PORTAL, route: true, kind: 'email', run: (fetch, email) => fetch(ROUTE_Q.portalAuthUser, { email }) },
  portalAuthInviteUser: { surface: PORTAL, route: true, kind: 'email', run: (fetch, email) => fetch(ROUTE_Q.portalAuthInviteUser, { email }) },
  dataroomAuthDomainPrivilege: { surface: DATAROOM, route: true, kind: 'domain', run: (fetch, domain) => fetch(ROUTE_Q.dataroomAuthDomainPrivilege, { domain }) },
  dataroomAuthDomainSharedCode: { surface: DATAROOM, route: true, kind: 'domain', run: (fetch, domain) => fetch(ROUTE_Q.dataroomAuthDomainSharedCode, { domain }) },
  dataroomAuthUser: { surface: DATAROOM, route: true, kind: 'email', run: (fetch, email) => fetch(ROUTE_Q.dataroomAuthUser, { email }) },
  dataroomAuthInviteUser: { surface: DATAROOM, route: true, kind: 'email', run: (fetch, email) => fetch(ROUTE_Q.dataroomAuthInviteUser, { email }) },
  // the invite routes wrap the lookup in Boolean(user)
  hasPortalAccess: { surface: PORTAL, route: true, kind: 'email', run: async (fetch, email) => Boolean(await fetch(ROUTE_Q.portalInviteAccess, { email })) },
  hasDataroomAccess: { surface: DATAROOM, route: true, kind: 'email', run: async (fetch, email) => Boolean(await fetch(ROUTE_Q.dataroomInviteAccess, { email })) },
  // check-domain returns { shared: !!result }; the lookup itself returns { _id } or null
  checkDomainShared: { surface: PORTAL, route: true, kind: 'domain', run: (fetch, domain) => fetch(ROUTE_Q.checkDomainShared, { domain }) },
};

// Every document type the queries read (for loaders that need a type list).
export const TYPES = [
  'company', 'category', 'investor', 'lpQuarterlyReport', 'teamMember', 'lpPipelineDeal', 'news', 'publication',
  'lpFundSettings', 'portalUser', 'domainPrivilege', 'dataroomFundContent', 'dataRoomDocument', 'trackRecord',
  'sanity.fileAsset', 'sanity.imageAsset',
];
