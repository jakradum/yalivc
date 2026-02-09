import { client } from '@/sanity/client';

export async function getCompanies() {
  return client.fetch(
    `*[_type == "company" && showOnMainWebsite == true] | order(order asc) {
      _id,
      name,
      slug,
     category->{
  name,
  slug
},
      oneLiner,
      detail,
      link,
      "logo": logo.asset->url,
      order
    }`
  );
}

export async function getCompanyBySlug(slug) {
  return client.fetch(
    `*[_type == "company" && slug.current == $slug && showOnMainWebsite == true][0]{
      _id,
      name,
      slug,
      category->{
  name,
  slug
},
      oneLiner,
      detail,
      link,
      "logo": logo.asset->url,
      founders[]{
        name,
        role,
        linkedin,
        "photo": photo.asset->url
      },
      story{
        title,
        author->{name, role, "photo": photo.asset->url},
        content
      },
      metrics[] | order(order asc),
      investmentDetails,
      companyInfo,
      achievements[] | order(date desc)
    }`,
    { slug }
  );
}

export async function getNews() {
  return client.fetch(
    `*[_type == "news"] | order(date desc) {
      _id,
      url,
      date,
      headlineEdited,
      isVideo,
      "publicationName": publication->name
    }`
  );
}

export async function getInvestmentPhilosophy() {
  return client.fetch(
    `*[_type == "investmentPhilosophy"][0]{
      philosophyText,
      lastUpdated
    }`
  );
}

export async function getTeamMembers() {
  return client.fetch(
    `*[_type == "teamMember" && showOnHomepage == true] | order(department asc, order asc) {
      _id,
      name,
      slug,
      role,
      department,
      bio,
      oneLiner,
      "photo": photo.asset->url,
      linkedIn,
      order,
      enableTeamPage
    }`
  );
}

export async function getTeamMemberBySlug(slug) {
  return client.fetch(
    `*[_type == "teamMember" && slug.current == $slug][0]{
      _id,
      name,
      slug,
      role,
      bio,
      oneLiner,
      personalPhilosophy,
      pullQuote,
      pullQuoteAttribution,
      outsideWork,
      recommendation {
        text,
        authorName,
        authorTitle
      },
      articles[] {
        title,
        url,
        publication,
        date
      },
      "photo": photo.asset->url,
      linkedIn,
      status,
      enableTeamPage
    }`,
    { slug }
  );
}

export async function getAllTeamMemberSlugs() {
  return client.fetch(
    `*[_type == "teamMember" && showOnHomepage == true] {
      "slug": slug.current
    }`
  );
}

export async function getOtherTeamMembers(currentSlug, limit = 4) {
  return client.fetch(
    `*[_type == "teamMember" && showOnHomepage == true && enableTeamPage == true && slug.current != $currentSlug] | order(order asc) [0...$limit] {
      _id,
      name,
      slug,
      role
    }`,
    { currentSlug, limit }
  );
}

export async function getCategories() {
  return client.fetch(
    `*[_type == "category"] | order(order asc, name asc) {
      _id,
      name,
      description,
      "slug": slug.current,
      order
    }`
  );
}

export async function getCategoryBySlug(slug) {
  return client.fetch(
    `*[_type == "category" && slug.current == $slug][0]{
      _id,
      name,
      slug,
      description,
      overview,
      whyYALICares
    }`,
    { slug }
  );
}

export async function getFAQs(type) {
  return client.fetch(
    `*[_type == "faq" && type == $type] | order(order asc){
      _id,
      question,
      answer,
      order
    }`,
    { type }
  );
}

export async function getSocialUpdates(limit = 6) {
  return client.fetch(
    `*[_type == "socialUpdate" && featured == true] | order(date desc) [0...$limit] {
      _id,
      platform,
      url,
      "image": image.asset->url,
      excerpt,
      date,
      featuredTeamMember->{
        _id,
        name,
        "slug": slug.current
      },
      featuredCompany->{
        _id,
        name,
        "slug": slug.current
      }
    }`,
    { limit }
  );
}

export async function getSocialUpdatesByTeamMember(teamMemberId) {
  return client.fetch(
    `*[_type == "socialUpdate" && featuredTeamMember._ref == $teamMemberId] | order(date desc) {
      _id,
      platform,
      url,
      "image": image.asset->url,
      excerpt,
      date
    }`,
    { teamMemberId }
  );
}

// UNIFIED CONTENT QUERIES (News + Blogs)
export async function getContentByCompany(companySlug) {
  const news = await client.fetch(
    `*[_type == "news" && $companySlug in relatedCompanies[]->slug.current] | order(date desc) {
      _id,
      date,
      headlineEdited,
      url,
      "publicationName": publication->name,
      isVideo
    }`,
    { companySlug }
  );

  const blogs = await client.fetch(
    `*[_type == "blogPost" && status == "published" && references(*[_type=="company" && slug.current == $slug]._id)] | order(publishedAt desc) {
      _id,
      title,
      slug,
      publishedAt,
      contentType
    }`,
    { slug: companySlug }
  );

  return [
    ...news.map((n) => ({
      _id: n._id,
      type: 'press',
      date: n.date,
      title: n.headlineEdited,
      url: n.url,
      source: n.publicationName,
      isExternal: true,
    })),
    ...blogs.map((b) => ({
      _id: b._id,
      type: b.contentType || 'blog',
      date: b.publishedAt,
      title: b.title,
      url: `/insights/blog/${b.slug.current}`,
      source: 'YALI Capital',
      isExternal: false,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function getContentByCategory(categorySlug) {
  const news = await client.fetch(
    `*[_type == "news" && $categorySlug in relatedCategories[]->slug.current] | order(date desc) {
      _id,
      date,
      headlineEdited,
      url,
      "publicationName": publication->name,
      isVideo
    }`,
    { categorySlug }
  );

  const blogs = await client.fetch(
    `*[_type == "blogPost" && status == "published" && references(*[_type=="category" && slug.current == $slug]._id)] | order(publishedAt desc) {
      _id,
      title,
      slug,
      publishedAt,
      contentType
    }`,
    { slug: categorySlug }
  );

  return [
    ...news.map((n) => ({
      _id: n._id,
      type: 'press',
      date: n.date,
      title: n.headlineEdited,
      url: n.url,
      source: n.publicationName,
      isExternal: true,
    })),
    ...blogs.map((b) => ({
      _id: b._id,
      type: b.contentType || 'blog',
      date: b.publishedAt,
      title: b.title,
      url: `/insights/blog/${b.slug.current}`,
      source: 'YALI Capital',
      isExternal: false,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
}

// LEGACY - kept for backward compatibility
export async function getNewsByCategory(categorySlug) {
  return client.fetch(
    `*[_type == "news" && $categorySlug in relatedCategories[]->slug.current] | order(date desc) {
      _id,
      url,
      date,
      headlineEdited,
      isVideo,
      "publicationName": publication->name
    }[0...5]`,
    { categorySlug }
  );
}

export async function getNewsByCompany(companySlug) {
  return client.fetch(
    `*[_type == "news" && $companySlug in relatedCompanies[]->slug.current] | order(date desc) {
      _id,
      url,
      date,
      headlineEdited,
      isVideo,
      "publicationName": publication->name
    }[0...5]`,
    { companySlug }
  );
}

// BLOG QUERIES
export async function getBlogPostBySlug(slug) {
  return client.fetch(
    `*[_type == "blogPost" && slug.current == $slug && status == "published"][0]{
      _id,
      title,
      slug,
      blurb,
      body[]{
        ...,
        _type == "image" => {
          ...,
          asset->
        }
      },
      contentType,
      publishedAt,
      featuredImage {
        asset->{url},
        alt
      },
      author->{
        _id,
        name,
        role,
        oneLiner,
        "photo": photo.asset->url,
        linkedIn
      },
      categories[]->{
        _id,
        name,
        slug
      },
      companies[]->{
        _id,
        name,
        slug
      },
      metaTitle,
      metaDescription,
      ogImage {
        asset->{url}
      }
    }`,
    { slug }
  );
}

export async function getAllBlogPosts(options = {}) {
  const { limit = 12, offset = 0, authorId = null, categoryId = null, companyId = null } = options;

  let filters = `_type == "blogPost" && status == "published"`;

  if (authorId) filters += ` && author._ref == "${authorId}"`;
  if (categoryId) filters += ` && "${categoryId}" in categories[]._ref`;
  if (companyId) filters += ` && "${companyId}" in companies[]._ref`;

  return client.fetch(
    `{
      "posts": *[${filters}] | order(featured desc, publishedAt desc) [${offset}...${offset + limit}] {
        _id,
        title,
        slug,
        blurb,
        contentType,
        publishedAt,
        featured,
        featuredImage {
          asset->{url},
          alt
        },
        author->{
          _id,
          name
        },
        categories[]->{
          _id,
          name
        },
        companies[]->{
          _id,
          name
        }
      },
      "total": count(*[${filters}])
    }`
  );
}

export async function getRelatedBlogPosts(currentPostId, categories, companies, limit = 3) {
  return client.fetch(
    `*[_type == "blogPost" 
      && status == "published" 
      && _id != $currentPostId
      && (
        count((categories[]._ref)[@ in $categoryIds]) > 0 ||
        count((companies[]._ref)[@ in $companyIds]) > 0
      )
    ] | order(publishedAt desc) [0...$limit] {
      _id,
      title,
      slug,
      blurb,
      publishedAt,
      featuredImage {
        asset->{url},
        alt
      },
      author->{
        name
      }
    }`,
    {
      currentPostId,
      categoryIds: categories?.map((c) => c._id) || [],
      companyIds: companies?.map((c) => c._id) || [],
      limit,
    }
  );
}

export async function getBlogAuthors() {
  return client.fetch(
    `*[_type == "teamMember" && count(*[_type == "blogPost" && status == "published" && references(^._id)]) > 0] | order(name asc) {
      _id,
      name
    }`
  );
}

export async function getBlogCategories() {
  return client.fetch(
    `*[_type == "category" && count(*[_type == "blogPost" && status == "published" && references(^._id)]) > 0] | order(name asc) {
      _id,
      name
    }`
  );
}

export async function getBlogCompanies() {
  return client.fetch(
    `*[_type == "company" && count(*[_type == "blogPost" && status == "published" && references(^._id)]) > 0] | order(name asc) {
      _id,
      name
    }`
  );
}

// NEWSLETTER QUERIES
export async function getAllNewsletters() {
  return client.fetch(
    `*[_type == "newsletter" && status == "published"] | order(publishedDate desc) {
      _id,
      title,
      slug,
      edition,
      publishedDate,
      shortDescription,
      coverImage {
        asset->{url},
        alt
      }
    }`
  );
}

export async function getNewsletterBySlug(slug) {
  return client.fetch(
    `*[_type == "newsletter" && slug.current == $slug && status == "published"][0]{
      _id,
      title,
      slug,
      edition,
      publishedDate,
      shortDescription,
      coverImage {
        asset->{url},
        alt
      },
      sections[]{
        _type,
        _key,
        // Opening Note
        _type == "openingNote" => {
          sectionTitle,
          author->{
            _id,
            name,
            role,
            "slug": slug.current,
            "photo": photo.asset->url
          },
          body[]{
            ...,
            _type == "image" => {
              ...,
              asset->
            }
          }
        },
        // Essay
        _type == "essay" => {
          title,
          body[]{
            ...,
            _type == "image" => {
              ...,
              asset->
            }
          },
          author->{
            _id,
            name,
            role,
            "slug": slug.current,
            "photo": photo.asset->url
          }
        },
        // Portfolio Spotlight
        _type == "portfolioSpotlight" => {
          sectionTitle,
          company->{
            _id,
            name,
            slug,
            oneLiner,
            "logo": logo.asset->url,
            link
          },
          body[]{
            ...,
            _type == "image" => {
              ...,
              asset->
            }
          }
        },
        // Guest Column
        _type == "guestColumn" => {
          sectionTitle,
          guestName,
          guestTitle,
          guestCompany,
          guestPhoto {
            asset->{url}
          },
          body[]{
            ...,
            _type == "image" => {
              ...,
              asset->
            }
          }
        },
        // Radar
        _type == "radar" => {
          sectionTitle,
          items[]{
            technology,
            oneLiner,
            contributor->{
              _id,
              name,
              "slug": slug.current,
              "photo": photo.asset->url
            }
          }
        },
        // Reading
        _type == "reading" => {
          sectionTitle,
          items[]{
            title,
            url,
            blurb
          }
        },
        // Freeform
        _type == "freeform" => {
          title,
          body[]{
            ...,
            _type == "image" => {
              ...,
              asset->
            }
          }
        }
      }
    }`,
    { slug }
  );
}

export async function getAllNewsletterSlugs() {
  return client.fetch(
    `*[_type == "newsletter" && status == "published"] {
      "slug": slug.current
    }`
  );
}

export async function getLatestNewsletter() {
  return client.fetch(
    `*[_type == "newsletter" && status == "published"] | order(publishedDate desc)[0] {
      _id,
      title,
      slug,
      edition,
      publishedDate,
      shortDescription
    }`
  );
}

// LP REPORT QUERIES
export async function getLPReports() {
  return client.fetch(
    `*[_type == "quarterlyReport" && isPublished == true] | order(publishedAt desc) {
      _id,
      title,
      slug,
      quarter,
      fiscalYear,
      publishedAt,
      summary,
      highlights,
      "pdfUrl": pdfFile.asset->url
    }`
  );
}

export async function getLPReportBySlug(slug) {
  return client.fetch(
    `*[_type == "quarterlyReport" && slug.current == $slug && isPublished == true][0]{
      _id,
      title,
      slug,
      quarter,
      fiscalYear,
      publishedAt,
      summary,
      highlights,
      "pdfUrl": pdfFile.asset->url,
      "pdfFileName": pdfFile.asset->originalFilename,
      coverNote {
        greeting,
        paragraphs,
        signatoryName,
        signatoryTitle
      },
      fundSummary {
        targetCorpus,
        capitalRaised,
        capitalDeployed,
        navPerUnit,
        irr,
        moic
      },
      portfolioData[] {
        company->{
          _id,
          name,
          slug,
          oneLiner,
          detail,
          "logo": logo.asset->url,
          link,
          category->{name, slug}
        },
        dateOfFirstInvestment,
        fundingRound,
        totalAmountInvested,
        ownershipFullyDiluted,
        fmv,
        amountReturnedToInvestors,
        multipleOfInvestment,
        keyCoInvestors
      },
      mediaCoverage[] {
        date,
        title,
        url
      },
      contactInfo {
        newsroomUrl,
        irEmail
      }
    }`,
    { slug }
  );
}

export async function getAllLPReportSlugs() {
  return client.fetch(
    `*[_type == "quarterlyReport" && isPublished == true] {
      "slug": slug.current
    }`
  );
}

// Get all companies for LP reports (with full data)
export async function getCompaniesForLPReport() {
  return client.fetch(
    `*[_type == "company"] | order(order asc) {
      _id,
      name,
      slug,
      oneLiner,
      detail,
      "logo": logo.asset->url,
      link,
      category->{name, slug},
      founders,
      companyInfo,
      investmentDetails
    }`
  );
}

// ==========================================
// NEW LP PORTAL QUERIES (MECE Schema)
// ==========================================

// Get fund settings singleton
export async function getLPFundSettings() {
  return client.fetch(
    `*[_type == "lpFundSettings"][0]{
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
        dpi
      }
    }`
  );
}

// Get all portfolio companies with investment data (for LP reports)
export async function getLPInvestments() {
  return client.fetch(
    `*[_type == "company" && investmentStatus == "active"] | order(order asc) {
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
        "coInvestors": coInvestors[]->{
          _id,
          name,
          type
        }
      },
      "latestQuarter": quarterlyUpdates[] | order(fiscalYear desc, quarter desc)[0] {
        quarter,
        fiscalYear,
        currentFMV,
        currentOwnershipPercent,
        amountReturned,
        multipleOfInvestment,
        roundMoics,
        tableFootnotes,
        updateNotes,
        revenueINR,
        patINR,
        teamSize,
        keyMetrics
      }
    }`
  );
}

// Get company investment data by slug (includes all quarterly updates)
export async function getLPInvestmentByCompanySlug(companySlug) {
  return client.fetch(
    `*[_type == "company" && slug.current == $companySlug][0]{
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
      investmentDate,
      fundingRound,
      preMoneyValuation,
      totalRoundSize,
      postMoneyValuation,
      yaliInvestmentAmount,
      yaliOwnershipPercent,
      coInvestors,
      investmentStatus,
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
        "coInvestors": coInvestors[]->{
          _id,
          name,
          type,
          "logo": logo.asset->url
        }
      },
      "quarterlyUpdates": quarterlyUpdates[] | order(fiscalYear desc, quarter desc) {
        quarter,
        fiscalYear,
        currentFMV,
        currentOwnershipPercent,
        amountReturned,
        multipleOfInvestment,
        roundMoics,
        tableFootnotes,
        updateNotes,
        revenueINR,
        patINR,
        teamSize,
        keyMetrics
      },
      "latestQuarter": quarterlyUpdates[] | order(fiscalYear desc, quarter desc)[0] {
        quarter,
        fiscalYear,
        currentFMV,
        currentOwnershipPercent,
        amountReturned,
        multipleOfInvestment,
        roundMoics,
        tableFootnotes,
        updateNotes,
        revenueINR,
        patINR,
        teamSize,
        keyMetrics
      }
    }`,
    { companySlug }
  );
}

// Get company quarter updates for a specific quarter
export async function getLPQuarterUpdates(quarter, fiscalYear) {
  return client.fetch(
    `*[_type == "company" && investmentStatus == "active" && count(quarterlyUpdates[quarter == $quarter && fiscalYear == $fiscalYear]) > 0] | order(order asc) {
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
        currentFMV,
        currentOwnershipPercent,
        amountReturned,
        multipleOfInvestment,
        updateNotes,
        revenueINR,
        patINR,
        teamSize,
        keyMetrics
      }
    }`,
    { quarter, fiscalYear }
  );
}

// Get historical quarterly updates for a specific company
export async function getLPCompanyHistory(companySlug) {
  return client.fetch(
    `*[_type == "company" && slug.current == $companySlug][0] {
      "quarterlyHistory": quarterlyUpdates[] | order(fiscalYear desc, quarter desc) {
        quarter,
        fiscalYear,
        currentFMV,
        currentOwnershipPercent,
        multipleOfInvestment,
        updateNotes,
        revenueINR,
        patINR,
        teamSize,
        keyMetrics
      }
    }.quarterlyHistory`,
    { companySlug }
  );
}

// Get active pipeline deals
export async function getLPActivePipeline() {
  return client.fetch(
    `*[_type == "lpPipelineDeal" && isActive == true && stage != "passed" && stage != "closed"] | order(stage asc, addedDate desc) {
      _id,
      companyName,
      "sector": coalesce(sector->name, sectorOverride),
      proposedAmountINR,
      stage,
      description,
      addedDate
    }`
  );
}

// Get all pipeline deals (including closed/passed for tracking)
export async function getLPAllPipelineDeals() {
  return client.fetch(
    `*[_type == "lpPipelineDeal"] | order(stage asc, addedDate desc) {
      _id,
      companyName,
      "sector": coalesce(sector->name, sectorOverride),
      proposedAmountINR,
      stage,
      description,
      isActive,
      addedDate,
      lastUpdated,
      notes
    }`
  );
}

// Get new LP quarterly reports list
export async function getLPQuarterlyReports() {
  return client.fetch(
    `*[_type == "lpQuarterlyReport" && isPublished == true] | order(fiscalYear desc, quarter desc) {
      _id,
      title,
      "slug": slug.current,
      quarter,
      fiscalYear,
      reportingDate,
      publishDate,
      "pdfUrl": generatedPdf.asset->url,
      fundMetrics
    }`
  );
}

// Get new LP quarterly report by slug (full data)
export async function getLPQuarterlyReportBySlug(slug) {
  return client.fetch(
    `*[_type == "lpQuarterlyReport" && slug.current == $slug && isPublished == true][0]{
      _id,
      title,
      "slug": slug.current,
      quarter,
      fiscalYear,
      reportingDate,
      publishDate,
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
        role,
        "photo": photo.asset->url
      },
      "pdfUrl": generatedPdf.asset->url,
      "fundFinancialsPdfUrl": fundFinancialsPdf.asset->url,
      // Portfolio (references to Core Content)
      "portfolioCompanies": portfolioCompanies[]->{
        _id,
        name,
        "slug": slug.current,
        oneLiner,
        detail,
        "logo": logo.asset->url,
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
        quarterlyUpdates
      },
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
      mediaNotes
    }`,
    { slug }
  );
}

// Get all LP quarterly report slugs (for static generation)
export async function getAllLPQuarterlyReportSlugs() {
  return client.fetch(
    `*[_type == "lpQuarterlyReport" && isPublished == true] {
      "slug": slug.current
    }`
  );
}

// Get the latest LP quarterly report
export async function getLatestLPQuarterlyReport() {
  return client.fetch(
    `*[_type == "lpQuarterlyReport" && isPublished == true] | order(fiscalYear desc, quarter desc)[0] {
      _id,
      title,
      "slug": slug.current,
      quarter,
      fiscalYear,
      reportingDate,
      publishDate,
      "pdfUrl": generatedPdf.asset->url
    }`
  );
}

// Get all portfolio company slugs (for static generation and navigation)
export async function getAllLPInvestmentSlugs() {
  return client.fetch(
    `*[_type == "company" && investmentStatus == "active"] | order(name asc) {
      "slug": slug.current,
      name,
      investmentDate
    }`
  );
}

// Get all available quarters from published LP reports (for dropdown)
export async function getAvailableLPQuarters() {
  return client.fetch(
    `*[_type == "lpQuarterlyReport" && isPublished == true] | order(fiscalYear desc, quarter desc) {
      _id,
      title,
      "slug": slug.current,
      quarter,
      fiscalYear,
      publishDate,
      "pdfUrl": generatedPdf.asset->url
    }`
  );
}

// Get news articles within a date range (for quarterly media coverage)
export async function getNewsByDateRange(startDate, endDate) {
  return client.fetch(
    `*[_type == "news" && date >= $startDate && date <= $endDate] | order(date desc) {
      _id,
      headlineEdited,
      date,
      url,
      isVideo,
      "publicationName": publication->name
    }`,
    { startDate, endDate }
  );
}

// Get social updates within a date range (for quarterly media coverage)
export async function getSocialUpdatesByDateRange(startDate, endDate) {
  return client.fetch(
    `*[_type == "socialUpdate" && date >= $startDate && date <= $endDate] | order(date desc) {
      _id,
      platform,
      url,
      excerpt,
      date,
      "imageUrl": image.asset->url,
      "teamMemberName": featuredTeamMember->name,
      "companyName": featuredCompany->name
    }`,
    { startDate, endDate }
  );
}
