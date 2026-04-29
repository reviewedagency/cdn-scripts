var Webflow = Webflow || []

function getUrlParam (name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]')
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
    results = regex.exec(location.search)
  return results === null
    ? ''
    : decodeURIComponent(results[1].replace(/\+/g, ' '))
}

const delayExecution = ms => new Promise(resolve => setTimeout(resolve, ms))

const businessName =
  getUrlParam('business_name') || localStorage.getItem('businessName')
const email = getUrlParam('email')
const fId = getUrlParam('f_id')
const sender = getUrlParam('sender')
const fIdExist = fId && fId !== 'undefined'

// TASK 6: The banner should be hidden if no URL params / local storage
if (!businessName) {
  $('.home-preview-form').hide()
}

// TASK 8: Populate email field if email URL param exists
Webflow.push(function () {
  if (email) {
    $('input[type=email]').val(email)
  }
})

// TASK 1 & TASK 7: Append URL params to each page click
const currentParams = new URLSearchParams(window.location.search)
if (currentParams.toString()) {
  document.querySelectorAll('a[href]').forEach(link => {
    if (link.href === '#') {
      return
    }
    try {
      const url = new URL(link.href, window.location.origin)

      if (url.origin === window.location.origin) {
        currentParams.forEach((value, key) => {
          url.searchParams.set(key, value)
        })

        link.href = url.toString()
      }
    } catch (error) {}
  })
}

// TASK 2: Button Click should fire to Webhook
$('a.start-trial-button, div.start-trial-button').on('click', async e => {
  if (getUrlParam('f_id')) {
    e.preventDefault()
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        businessName,
        email,
        fId,
        sender
      })
    }

    await fetch(
      'https://thereviewplanner-api-npfcm.ondigitalocean.app/supabase/website-button-trial-click',
      options
    )
    location.href = $(e.target).closest('a').attr('href')
  }
})

//TASK 3: Website View should fire to Webhook
if (fIdExist && email && location.pathname === '/') {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      businessName,
      email,
      fId,
      sender
    })
  }

  fetch(
    'https://thereviewplanner-api-npfcm.ondigitalocean.app/supabase/website-view-event',
    options
  )
}

const countFormatter = count => {
  if (Number(count) > 10000) {
    return Intl.NumberFormat('en', {
      notation: 'compact',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(Number(count))
  }

  return Intl.NumberFormat('en', {
    notation: 'compact'
  }).format(Number(count))
}

const convertImageToBase64 = async imageUrl => {
  try {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl })
    }

    const response = await fetch(
      'https://insta-app-xzm2x.ondigitalocean.app/image/convert/base64',
      options
    )
    const responseJson = await response.json()
    return responseJson.data
  } catch (error) {}
}

const fetchBusinessInfo = async fId => {
  const accountInfo = {
    record_exist: false,
    businessName: '',
    averageRating: 0,
    reviewCount: 0,
    featuredImage: ''
  }

  try {
    const response = await fetch(
      `https://thereviewplanner-api-npfcm.ondigitalocean.app/supabase/google-data/${fId}`,
      {
        method: 'GET'
      }
    )
    const jsonResponse = await response.json()
    const responseData = jsonResponse.data
    if (responseData) {
      const imageBase64 = await convertImageToBase64(responseData.featuredImage)
      accountInfo['record_exist'] = true
      accountInfo['businessName'] = responseData.businessName
      accountInfo['averageRating'] = responseData.averageRating
      accountInfo['reviewCount'] = countFormatter(responseData.reviewCount)
      accountInfo['featuredImage'] = imageBase64
    }

    return accountInfo
  } catch (fetchBusinessInfoError) {
    console.log('🚀 ~ fetchBusinessInfoError:', fetchBusinessInfoError)

    // fetch('https://hook.us1.make.com/ciqnwasinhwxpp71ymke4awsibancq3d', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({}),
    // });
  }
}

// TASK 5: Banner should only show when lead exists
const processUserData = async fId => {
  fetchBusinessInfo(fId)
    .then(response => {
      if (response.record_exist) {
        $('.business-name').text(response.businessName)
        $('.average-rating').text(response.averageRating)
        $('.total-review-count').text(response.reviewCount)
        $('.featured-image').attr('src', response.featuredImage)
        localStorage.setItem('fId', response.fId)
        localStorage.setItem('businessName', response.businessName)
        localStorage.setItem('averageRating', response.averageRating)
        localStorage.setItem('reviewCount', response.reviewCount)
        localStorage.setItem('featuredImage', response.featuredImage)
        localStorage.setItem('lastInfoFetch', new Date().getTime())
        $('.home-preview-form').css('display', 'block')
      } else {
        localStorage.removeItem('fId')
        $('.home-preview-form').hide()
      }
    })
    .catch(error => {
      console.log('Error fetching business info: ', error)
    })
}

if (businessName) {
  if (email) {
    $('a').each(function () {
      if ($(this).attr('href') && $(this).attr('href') !== '#') {
        $(this).attr(
          'href',
          `${
            $(this).attr('href').split('?')[0]
          }?f_id=${fId}&business_name=${businessName}&email=${email}&sender=${sender}`
        )
      }
    })

    fetch(
      `https://thereviewplanner-api-npfcm.ondigitalocean.app/supabase/google-data/verify-existence?fId=${fId}&email=${email}`,
      {
        method: 'GET'
      }
    )
      .then(response => response.json())
      .then(result => {
        if (result.data) {
          if (getUrlParam('fId') === localStorage.getItem('fId')) {
            $('.featured-image').attr(
              'src',
              localStorage.getItem('featuredImage')
            )
            $('.business-name').text(localStorage.getItem('businessName'))
            $('.average-rating').text(localStorage.getItem('averageRating'))
            $('.total-review-count').text(localStorage.getItem('reviewCount'))

            const timeDifference =
              localStorage.getItem('lastInfoFetch') - new Date().getTime()
            if (timeDifference > 24 * 60 * 60 * 1000) {
              processUserData(fId)
            }
          } else {
            processUserData(fId)
          }
          $('.valid-user-info-container').css('display', 'block')
          localStorage.setItem('fId', fId)
        }
      })
      .catch(error => console.log('error verifying info', error))
  }

  if (!email && localStorage.getItem('fId')) {
    $('.featured-image').attr('src', localStorage.getItem('featuredImage'))
    $('.business-name').text(localStorage.getItem('businessName'))
    $('.average-rating').text(localStorage.getItem('averageRating'))
    $('.total-review-count').text(localStorage.getItem('reviewCount'))

    const timeDifference =
      localStorage.getItem('lastInfoFetch') - new Date().getTime()
    if (timeDifference > 24 * 60 * 60 * 1000) {
      processUserData(localStorage.getItem('fId'))
    }
    $('.valid-user-info-container').css('display', 'block')
  }
}

const runSkeleton = () => {
  // END

  // BEGIN 💙 MEMBERSCRIPT #23 v0.1 💙 SKELETON SCREENS/CONTENT LOADERS
  // This allows for the div blocks / pieces of text to have skeleton loads
  const skeletonElements = document.querySelectorAll('[ms-code-skeleton]')

  skeletonElements.forEach(element => {
    const skeletonDiv = document.createElement('div')
    skeletonDiv.classList.add('skeleton-loader')

    element.style.position = 'relative'
    element.appendChild(skeletonDiv)

    // Get delay from the attribute
    let delay = element.getAttribute('ms-code-skeleton')

    if (isNaN(delay)) {
      delay = 2000
    }

    setTimeout(() => {
      const skeletonDiv = element.querySelector('.skeleton-loader')
      if (skeletonDiv) {
        element.removeChild(skeletonDiv)
      }
    }, delay)
  })
  // END
}

runSkeleton()

// Phase 2

const searchGoogleInfo = async ({ businessName, businessAddress }) => {
  try {
    const myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')

    const response = await fetch(
      'https://thereviewplanner-api-npfcm.ondigitalocean.app/rapid-api/google/search-profile',
      {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify({
          businessName,
          businessAddress
        })
      }
    )
    const jsonResponse = await response.json()
    const responseData = jsonResponse.data
    if (responseData) {
      const mutatedRecords = await Promise.all(
        responseData.map(async item => {
          let imageBase64 = null
          if (item.featuredImage) {
            imageBase64 = await convertImageToBase64(item.featuredImage)
          }

          return {
            name: item.name,
            address: item.address,
            rating: item.rating,
            reviewCount: item.reviewCount,
            latitude: item.latitude,
            longitude: item.longitude,
            featuredImage: imageBase64,
            businessId: item.businessId,
            placeId: item.placeId,
            cid: item.cid,
            timezone: item.timezone,
            website: item.website,
            placeLink: item.placeLink,
            country: item.country,
            category: item.category,
            featuredImageOriginal: item.featuredImage
          }
        })
      )
      return mutatedRecords
    }

    return null
  } catch (searchGoogleInfoError) {
    console.log('🚀 ~ searchGoogleInfoError:', searchGoogleInfoError)
    return null
  }
}

// TASK 1:
let currentPlan = getUrlParam('plan') || 'monthly-basic'
$('a[href].start-trial-button')
  .not('.contact-sales,.immediate-purchase')
  .on('click', function (e) {
    e.preventDefault()
    const currentUrl = $(this).closest('a').attr('href')
    const url = new URL(currentUrl, window.location.origin)
    const planId = $(this).data('plan')
    const clickedPlan = planId
      ? `${$('.pricing-tab-link.active').attr('id')}-${planId}`
      : currentPlan
    url.searchParams.set('plan', clickedPlan)
    localStorage.setItem('rp_plan', clickedPlan)
    window.location.href = url.toString()
  })

document.addEventListener('DOMContentLoaded', async function () {
  const { data: defaultJsonData } = await window.$memberstackDom.getMemberJSON()
  const userSubscriptions = defaultJsonData?.subscriptions

  if (Array.isArray(userSubscriptions) && userSubscriptions.length > 0) {
    const unusedSubscriptionIndex = userSubscriptions.findIndex(subscription =>
      Object.keys(subscription).every(key =>
        [
          'subscription_id',
          'item_price_id_short',
          'upgrade_section_shown'
        ].includes(key)
      )
    )

    if (unusedSubscriptionIndex >= 0) {
      $('.add-account.step-2').show()
    }
  }

  // TASK 4:
  window.$memberstackDom.getCurrentMember().then(member => {
    const authenticatedUser = member.data?.auth
    if (authenticatedUser && location.pathname.includes('dashboard')) {
      fpr('referral', { email: authenticatedUser.email })
    }
    const customFields = member.data?.customFields
    if (
      customFields['trial-started']?.toLowerCase() === 'yes' &&
      customFields['trial-profile-added']?.toLowerCase() === 'no'
    ) {
      $('.add-account.step-2').show()
    }

    // TASK 9 Phase 2:
    if (customFields['free-review-banner-shown']?.toLowerCase() === 'yes') {
      $('#free-review-banner').removeClass('hide')
    } else {
      $('#free-review-banner').addClass('hide')
    }
  })

  $('#Business-Name, #Business-Address').on('input', () => {
    const businessName = $('#Business-Name').val()
    const businessAddress = $('#Business-Address').val()

    if (businessName && businessAddress) {
      $('.add-google-profile-button').removeClass('disabled')
    } else {
      $('.add-google-profile-button').addClass('disabled')
    }
  })

  if (location.pathname.includes('dashboard')) {
    // TASK 5:
    let googleProfiles
    Webflow.push(function () {
      $(document).off('submit')

      $('#add-google-profile-form').on('submit', async e => {
        e.preventDefault()
        $('#add-google-profile-form .button_text').text('Loading...')
        $('#add-google-profile-form .icon-slot .search').hide()
        $('#add-google-profile-form .icon-slot .loading').css('display', 'flex')
        $('#add-google-profile-form input[type="text"]').attr('disabled', true)
        $('.add-google-profile-button').addClass('disabled')

        const businessName = $('#Business-Name').val()
        const businessAddress = $('#Business-Address').val()

        googleProfiles = await searchGoogleInfo({
          businessName,
          businessAddress
        })
        const profileElement = $('#select-profile .results-box')
          .first()
          .removeClass('green')
        if (googleProfiles?.length > 0) {
          $('#select-profile .review-scroller').empty()
          googleProfiles.map((profile, index) => {
            const clonedElement = profileElement.clone()
            clonedElement.attr('data-index', index)
            clonedElement.find('.business-name').text(profile.name)
            clonedElement.find('.business-address').text(profile.address)
            clonedElement.find('.business-rating').text(profile.rating)
            if (profile.featuredImage) {
              clonedElement
                .find('.business-featured-image')
                .attr('src', profile.featuredImage)
            } else {
              clonedElement.find('.business-featured-image').remove()
            }

            $('#select-profile .review-scroller').append(clonedElement)

            $('#select-profile .results-box').on('click', function () {
              $('#select-profile .results-box').removeClass('green')
              $(this).addClass('green')
              $('.select-profile-add-account').removeClass('disabled')
            })
          })

          $('#add-account-step-2').hide()
          $('#select-profile').show()
        } else {
          $('#add-google-profile-form .button_text').text('Search')
          $('#add-google-profile-form .icon-slot .loading').hide()
          $('#add-google-profile-form .icon-slot .search').css(
            'display',
            'flex'
          )
          $('#add-google-profile-form input[type="text"]').attr(
            'disabled',
            false
          )
          $('.add-google-profile-button').removeClass('disabled')
        }
      })
    })

    // TASK 6:
    $('#select-profile .back-button').on('click', function () {
      $('#select-profile .results-box:not(:first)').remove()
      $('#add-google-profile-form .button_text').text('Search')
      $('#add-google-profile-form .icon-slot .loading').hide()
      $('#add-google-profile-form .icon-slot .search').css('display', 'flex')
      $('#add-google-profile-form input[type="text"]').attr('disabled', false)
      $('.add-google-profile-button').removeClass('disabled')
      $('.select-profile-add-account').addClass('disabled')
      $('#select-profile').hide()
      $('#add-account-step-2').show()
    })

    // TASK 7:
    $('#select-profile .select-profile-add-account').on(
      'click',
      async function () {
        $('.select-profile-add-account').addClass('disabled')
        const selectedIndex = $('#select-profile .results-box.green').data(
          'index'
        )
        const selectedProfileData = googleProfiles[selectedIndex]

        const { data: member } = await window.$memberstackDom.getCurrentMember()
        const { auth, customFields } = member

        const { data: currentJsonData } =
          await window.$memberstackDom.getMemberJSON()

        if (Array.isArray(currentJsonData?.subscriptions)) {
          const updatedSubscriptions = currentJsonData.subscriptions
          const targetSubscriptionIndex = updatedSubscriptions.findIndex(
            subscription =>
              Object.keys(subscription).every(key =>
                [
                  'subscription_id',
                  'item_price_id_short',
                  'upgrade_section_shown'
                ].includes(key)
              )
          )

          if (targetSubscriptionIndex >= 0) {
            if (updatedSubscriptions.length === 1) {
              await window.$memberstackDom.updateMember({
                customFields: {
                  ...customFields,
                  'trial-profile-added': 'Yes',
                  'trial-started': 'Yes'
                }
              })
            }

            updatedSubscriptions[targetSubscriptionIndex] = {
              ...updatedSubscriptions[targetSubscriptionIndex],
              business_name: selectedProfileData.name,
              business_address: selectedProfileData.address,
              business_picture: selectedProfileData.featuredImageOriginal,
              business_rating: selectedProfileData.rating,
              business_review_count: selectedProfileData.reviewCount,
              cid: selectedProfileData.cid,
              business_id: selectedProfileData.businessId,
              place_id: selectedProfileData.placeId,
              reviews_published: 0,
              reviews_published_percentage: '0%',
              reviews_pending: 0,
              reviews_pending_percentage: '0%',
              reviews_positive: 0,
              reviews_positive_percentage: '0%',
              reviews_negative: 0,
              reviews_negative_percentage: '0%',
              targeting_gender: '',
              targeting_language: [],
              targeting_locations: [],
              monthly_reviews: []
            }

            await window.$memberstackDom.updateMemberJSON({
              json: {
                ...currentJsonData,
                subscriptions: updatedSubscriptions
              }
            })

            await fetch(
              'https://n8n.thereviewdirectory.com/webhook/b3305d99-c3c0-4d0a-a952-8e21859acbff',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  email: auth.email,
                  memberstack_id: member.id,
                  business_id: selectedProfileData.businessId,
                  place_id: selectedProfileData.placeId,
                  cid: selectedProfileData.cid,
                  business_name: selectedProfileData.name,
                  business_address: selectedProfileData.address,
                  business_rating: selectedProfileData.rating,
                  review_count: selectedProfileData.reviewCount,
                  business_timezone: selectedProfileData.timezone,
                  business_website: selectedProfileData.website,
                  business_place_link: selectedProfileData.placeLink,
                  business_country: selectedProfileData.country,
                  business_category: selectedProfileData.category
                })
              }
            )
          }
        }

        await delayExecution(10000)

        window.location.reload()
      }
    )

    // TASK 8:
    $('a[href].start-trial-button.immediate-purchase:not(.disabled)').on(
      'click',
      async function (e) {
        const { data: currentJsonData } =
          await window.$memberstackDom.getMemberJSON()

        const customerId = currentJsonData?.customer_id

        e.preventDefault()
        $(e.target).closest('.immediate-purchase').addClass('disabled')
        $(e.target)
          .closest('.immediate-purchase')
          .find('.button-text-wrap')
          .text('Processing...')
        const planName = $(this).data('plan')
        const planInterval = $('.pricing-tab-link.active').attr('id')
        if (
          customerId &&
          ['basic', 'pro'].includes(planName) &&
          ['monthly', 'quarterly', 'yearly'].includes(planInterval)
        ) {
          const response = await fetch(
            'https://thereviewplanner-api-npfcm.ondigitalocean.app/chargebee/checkout-new-subscription',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                customerId,
                planName,
                planInterval
              })
            }
          )

          const responseJson = await response.json()
          const checkoutUrl = responseJson?.data?.checkout_url
          if (checkoutUrl) {
            window.location.href = checkoutUrl
          }
          $(e.target).closest('.immediate-purchase').removeClass('disabled')
          $(e.target)
            .closest('.immediate-purchase')
            .find('.button-text-wrap')
            .text('Use For New Profile')
        }
      }
    )

    // TASK 17:
    $('#targeting-save-button').on('click', async function (e) {
      e.preventDefault()
      const selectedSubscriptionId = $('.current-business-name').data(
        'subscription-id'
      )
      $(this).text('Saving...').attr('disabled', true)
      const selectedGender =
        $('.custom-dropdown.gender .custom-dropdown-option.selected').data(
          'value'
        ) || ''
      const selectedLanguages = []
      $('.custom-dropdown.languages .custom-dropdown-option.selected').each(
        function () {
          selectedLanguages.push($(this).data('value'))
        }
      )
      const selectedLocations = []
      $('.custom-dropdown.locations .custom-dropdown-option.selected').each(
        function () {
          selectedLocations.push($(this).data('value'))
        }
      )

      const { data: currentJsonData } =
        await window.$memberstackDom.getMemberJSON()
      const updatedSubscriptions = currentJsonData.subscriptions
      const targetSubscriptionIndex = updatedSubscriptions.findIndex(
        subscription => subscription.subscription_id === selectedSubscriptionId
      )

      if (targetSubscriptionIndex >= 0) {
        updatedSubscriptions[targetSubscriptionIndex] = {
          ...updatedSubscriptions[targetSubscriptionIndex],
          targeting_gender: selectedGender,
          targeting_language: selectedLanguages,
          targeting_locations: selectedLocations
        }

        await window.$memberstackDom.updateMemberJSON({
          json: {
            ...currentJsonData,
            subscriptions: updatedSubscriptions
          }
        })
      }

      $(this).text('Save').attr('disabled', false)
    })

    $('.upgrade-account-button:not(.disabled)').on('click', async function (e) {
      const { data: currentJsonData } =
        await window.$memberstackDom.getMemberJSON()

      const customerId = currentJsonData?.customer_id
      const subscriptionId = $('.current-business-name').data('subscription-id')

      e.preventDefault()
      $(e.target).closest('.upgrade-account-button').addClass('disabled')
      $(e.target)
        .closest('.upgrade-account-button')
        .find('.button_text')
        .text('Processing...')
      if (customerId && subscriptionId) {
        const response = await fetch(
          'https://thereviewplanner-api-npfcm.ondigitalocean.app/chargebee/checkout-subscription-upgrade',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              customerId,
              subscriptionId
            })
          }
        )

        const responseJson = await response.json()
        const checkoutUrl = responseJson?.data?.checkout_url
        if (checkoutUrl) {
          window.location.href = checkoutUrl
        }
        $(e.target).closest('.upgrade-account-button').removeClass('disabled')
        $(e.target)
          .closest('.upgrade-account-button')
          .find('.button_text')
          .text('Upgrade Account')
      }
    })

    function clearCustomDropdownDisplay () {
      $('.custom-dropdown-option.selected').removeClass('selected')
      $('.custom-dropdown').each(function () {
        const placeholder = $(this).data('placeholder') || 'Select options'
        $(this).find('.custom-dropdown-toggle span').text(placeholder)
      })
      $('.tags-container').empty()
    }

    const processDashboardInfo = async subscriptionId => {
      const { data: currentJsonData } =
        await window.$memberstackDom.getMemberJSON()
      const subscriptions = currentJsonData.subscriptions || []
      const accountElement = $(
        '.account-dropdown-card.manage-subscription'
      ).first()
      $('.account-list-container').empty()
      subscriptions.forEach(async subscription => {
        const clonedElement = accountElement.clone()
        clonedElement.attr('data-subscription-id', subscription.subscription_id)
        clonedElement.find('.business-name').text(subscription.business_name)
        const rating = Math.round(subscription.business_rating)
        clonedElement
          .find('.rating-container .star:lt(' + rating + ')')
          .addClass('filled')
        clonedElement
          .find('.rating-container .star:gt(' + (rating - 1) + ')')
          .removeClass('filled')

        if (subscription.business_picture) {
          const imageBase64 = await convertImageToBase64(
            subscription.business_picture
          )
          clonedElement.find('.business-picture').attr('src', imageBase64)
        }

        clonedElement.on('click', function (e) {
          e.preventDefault()
          const subscriptionId = $(this)
            .closest('.account-dropdown-card')
            .data('subscription-id')
          if (subscriptionId) {
            processDashboardInfo(subscriptionId)
            $(this).closest('.w-dropdown').trigger('w-close')
          }
        })

        $('.account-list-container').append(clonedElement)
      })

      let currentSubscription

      if (subscriptionId) {
        currentSubscription = subscriptions.find(
          subscription => subscription.subscription_id === subscriptionId
        )
      } else {
        currentSubscription = subscriptions[0]
      }

      if (currentSubscription) {
        $('.current-business-name').attr(
          'data-subscription-id',
          currentSubscription.subscription_id
        )
        $('.current-business-name').text(currentSubscription.business_name)
        $('.current-business-address').text(
          currentSubscription.business_address
        )
        $('.current-business-rating').text(currentSubscription.business_rating)
        $('.business-review-count').text(
          currentSubscription.business_review_count
        )
        $('.current-plan').text(currentSubscription.item_price_id_short)

        const rating = Math.round(currentSubscription.business_rating)
        $(
          '.business-rating-container .svg-default:lt(' + rating + ')'
        ).addClass('filled')
        $(
          '.business-rating-container .svg-default:gt(' + (rating - 1) + ')'
        ).removeClass('filled')

        if (currentSubscription.business_picture) {
          const imageBase64 = await convertImageToBase64(
            currentSubscription.business_picture
          )
          $('.current-business-picture').attr('src', imageBase64)
        }

        $('.reviews-published').text(currentSubscription.reviews_published)
        $('.reviews-published-percentage').text(
          currentSubscription.reviews_published_percentage
        )
        $('.reviews-pending').text(currentSubscription.reviews_pending)
        $('.reviews-pending-percentage').text(
          currentSubscription.reviews_pending_percentage
        )
        $('.reviews-positive').text(currentSubscription.reviews_positive)
        $('.reviews-positive-percentage').text(
          currentSubscription.reviews_positive_percentage
        )
        $('.reviews-negative').text(currentSubscription.reviews_negative)
        $('.reviews-negative-percentage').text(
          currentSubscription.reviews_negative_percentage
        )

        const parseMonthKey = monthKey => {
          if (!monthKey || typeof monthKey !== 'string') {
            return null
          }

          const [year, month] = monthKey.split('-').map(Number)
          if (!year || !month) {
            return null
          }

          return new Date(year, month - 1, 1)
        }

        const formatMonthLabel = monthKey => {
          const parsedDate = parseMonthKey(monthKey)
          if (!parsedDate) {
            return monthKey
          }

          return parsedDate.toLocaleString('en', { month: 'short' })
        }

        const normalizeMonthlyReviews = () => {
          const monthlyReviews = Array.isArray(
            currentSubscription.monthly_reviews
          )
            ? currentSubscription.monthly_reviews
            : []
          return monthlyReviews
            .filter(item => item && item.month)
            .sort((a, b) => {
              const dateA = parseMonthKey(a.month)
              const dateB = parseMonthKey(b.month)
              if (!dateA || !dateB) {
                return 0
              }
              return dateA.getTime() - dateB.getTime()
            })
        }

        const getFilteredMonthlyReviews = range => {
          const allMonthlyReviews = normalizeMonthlyReviews()
          if (range === 'all') {
            return allMonthlyReviews
          }

          const monthsBack = range === 'past-1-month' ? 1 : 12
          const now = new Date()
          const cutoffDate = new Date(
            now.getFullYear(),
            now.getMonth() - monthsBack,
            1
          )

          return allMonthlyReviews.filter(item => {
            const parsedDate = parseMonthKey(item.month)
            return parsedDate && parsedDate >= cutoffDate
          })
        }

        const renderReviewsChart = range => {
          const chartContainer = document.querySelector('#chart')
          if (!chartContainer || typeof ApexCharts === 'undefined') {
            return
          }

          const filteredData = getFilteredMonthlyReviews(range)
          const categories = filteredData.map(item =>
            formatMonthLabel(item.month)
          )
          const negativeSeries = filteredData.map(
            item => Number(item.negative) || 0
          )
          const positiveSeries = filteredData.map(
            item => Number(item.positive) || 0
          )
          const maxValue = Math.max(0, ...negativeSeries, ...positiveSeries)
          const yAxisMax = Math.max(10, Math.ceil((maxValue + 5) / 10) * 10)

          const chartOptions = {
            series: [
              { name: 'Negative Reviews', data: negativeSeries },
              { name: 'Positive Reviews', data: positiveSeries }
            ],
            chart: {
              type: 'area',
              height: 500,
              background: '#f4f4f5',
              toolbar: { show: false }
            },
            stroke: { curve: 'smooth', width: 5 },
            markers: { size: 6 },
            colors: ['#ef4444', '#22c55e'],
            fill: {
              type: 'gradient',
              gradient: { shadeIntensity: 1, opacityFrom: 0.6, opacityTo: 0.05 }
            },
            grid: {
              strokeDashArray: 4,
              borderColor: '#e0e0e0',
              xaxis: { lines: { show: true } }
            },
            xaxis: { categories },
            yaxis: {
              title: { text: 'Number of Reviews' },
              min: 0,
              max: yAxisMax
            },
            title: { text: 'Positive vs Negative Reviews', align: 'center' },
            tooltip: { shared: true },
            legend: { position: 'top' }
          }

          if (window.reviewDashboardChart) {
            window.reviewDashboardChart.updateOptions(chartOptions, true, true)
          } else {
            window.reviewDashboardChart = new ApexCharts(
              chartContainer,
              chartOptions
            )
            window.reviewDashboardChart.render()
          }
        }

        renderReviewsChart('all')

        $('.dropdown-dash.analytics .dropdown_item-wrapper').on(
          'click',
          function () {
            const selectedRange = $(this).data('value')
            const displayText = $(this).find('.dropdown_item_text').text()
            $('.dropdown-dash.analytics .dropdown_item_active_text').text(
              displayText
            )
            renderReviewsChart(selectedRange)
            $('#w-dropdown-toggle-1').trigger('w-close')
          }
        )

        const targetingGender = currentSubscription.targeting_gender || ''
        const targetingLanguages = currentSubscription.targeting_language || []
        const targetingLocations = currentSubscription.targeting_locations || []

        clearCustomDropdownDisplay()

        if (targetingGender) {
          $(
            `.custom-dropdown.gender .custom-dropdown-option[data-value="${targetingGender}"]`
          ).click()
        }

        if (targetingLanguages.length > 0) {
          targetingLanguages.forEach(language => {
            $(
              `.custom-dropdown.languages .custom-dropdown-option[data-value="${language}"]`
            ).click()
          })
        }

        if (targetingLocations.length > 0) {
          targetingLocations.forEach(location => {
            $(
              `.custom-dropdown.locations .custom-dropdown-option[data-value="${location}"]`
            ).click()
          })
        }

        if (currentSubscription.upgrade_section_shown) {
          $('.upgrade-section').show()
        } else {
          $('.upgrade-section').hide()
        }
      }
    }

    processDashboardInfo()

    const firstPromoterDashboardContainer = document.getElementById(
      'first-promoter-dashboard-container'
    )

    const defaultFirstPromoterDashboardLoading = () => {
      firstPromoterDashboardContainer.innerHTML = ''
      const loadingDiv = document.createElement('div')
      loadingDiv.textContent = 'Loading your promoter dashboard...'
      firstPromoterDashboardContainer.appendChild(loadingDiv)
    }

    const renderFirstPromoterDashboardIframe = accessToken => {
      if (accessToken) {
        firstPromoterDashboardContainer.innerHTML = ''
        const iframe = document.createElement('iframe')
        iframe.height = '850px'
        iframe.width = '100%'
        iframe.frameBorder = '0'
        iframe.allow = 'clipboard-write'
        iframe.src = `https://reviewplanner.firstpromoter.com/iframe?tk=${accessToken}`
        firstPromoterDashboardContainer.appendChild(iframe)
      } else {
        $('#first-promoter-dashboard-container div').html(
          'Oops, there seems to have been a problem'
        )
      }
    }

    defaultFirstPromoterDashboardLoading()

    try {
      const { data: member } = await window.$memberstackDom.getCurrentMember()
      const customFields = member?.customFields

      const fpTokenResponse = await fetch(
        'https://thereviewplanner-api-npfcm.ondigitalocean.app/first-promoter/promoter-iframe-token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            promoterId: customFields?.['first-promoter-id']
          })
        }
      )
      const fpTokenResponseJson = await fpTokenResponse.json()
      const accessToken = fpTokenResponseJson?.data?.accessToken
      renderFirstPromoterDashboardIframe(accessToken)
    } catch (error) {
      console.log(error)
      $('#first-promoter-dashboard-container div').html(
        'Oops, there seems to have been a problem'
      )
    }
  }
})
