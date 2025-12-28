import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import PaystubForm from './PaystubForm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CheckCircle, FileText, Shield, Clock, Users, DollarSign, Building, Briefcase } from 'lucide-react';

// State data with tax info, compliance, and SEO content
const stateData = {
  'alabama': {
    name: 'Alabama',
    abbr: 'AL',
    taxRate: '2% - 5%',
    hasStateTax: true,
    majorCities: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville'],
    population: '5.1 million',
    minWage: '$7.25',
    compliance: 'Alabama follows federal FLSA guidelines for pay stub requirements. While Alabama does not mandate specific pay stub information, employers must provide accurate wage documentation.',
  },
  'alaska': {
    name: 'Alaska',
    abbr: 'AK',
    taxRate: '0%',
    hasStateTax: false,
    majorCities: ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka'],
    population: '733,000',
    minWage: '$11.73',
    compliance: 'Alaska is one of the few states with no state income tax. Employers must still comply with federal wage and hour laws.',
  },
  'arizona': {
    name: 'Arizona',
    abbr: 'AZ',
    taxRate: '2.5%',
    hasStateTax: true,
    majorCities: ['Phoenix', 'Tucson', 'Mesa', 'Scottsdale'],
    population: '7.3 million',
    minWage: '$14.35',
    compliance: 'Arizona requires employers to provide itemized pay statements showing gross wages, deductions, and net pay.',
  },
  'arkansas': {
    name: 'Arkansas',
    abbr: 'AR',
    taxRate: '2% - 4.7%',
    hasStateTax: true,
    majorCities: ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale'],
    population: '3.0 million',
    minWage: '$11.00',
    compliance: 'Arkansas employers must provide pay stubs with hours worked, pay rate, and itemized deductions.',
  },
  'california': {
    name: 'California',
    abbr: 'CA',
    taxRate: '1% - 13.3%',
    hasStateTax: true,
    majorCities: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose'],
    population: '39 million',
    minWage: '$16.00',
    compliance: 'California Labor Code Section 226 requires detailed pay stubs including gross wages, total hours, piece rates, deductions, net wages, pay period dates, employee name and ID, and employer information.',
  },
  'colorado': {
    name: 'Colorado',
    abbr: 'CO',
    taxRate: '4.4%',
    hasStateTax: true,
    majorCities: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins'],
    population: '5.8 million',
    minWage: '$14.42',
    compliance: 'Colorado requires employers to provide written statements of earnings and deductions with each pay period.',
  },
  'connecticut': {
    name: 'Connecticut',
    abbr: 'CT',
    taxRate: '3% - 6.99%',
    hasStateTax: true,
    majorCities: ['Bridgeport', 'New Haven', 'Hartford', 'Stamford'],
    population: '3.6 million',
    minWage: '$15.69',
    compliance: 'Connecticut requires itemized wage statements showing hours worked, gross pay, itemized deductions, and net pay.',
  },
  'delaware': {
    name: 'Delaware',
    abbr: 'DE',
    taxRate: '2.2% - 6.6%',
    hasStateTax: true,
    majorCities: ['Wilmington', 'Dover', 'Newark', 'Middletown'],
    population: '1.0 million',
    minWage: '$13.25',
    compliance: 'Delaware requires employers to furnish employees with a statement of deductions made from wages.',
  },
  'florida': {
    name: 'Florida',
    abbr: 'FL',
    taxRate: '0%',
    hasStateTax: false,
    majorCities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville'],
    population: '22 million',
    minWage: '$13.00',
    compliance: 'Florida has no state income tax. While pay stub laws are minimal, employers should provide documentation for federal compliance.',
  },
  'georgia': {
    name: 'Georgia',
    abbr: 'GA',
    taxRate: '1% - 5.49%',
    hasStateTax: true,
    majorCities: ['Atlanta', 'Augusta', 'Columbus', 'Savannah'],
    population: '10.9 million',
    minWage: '$7.25',
    compliance: 'Georgia requires employers to provide pay stubs showing gross pay, deductions, and net pay with each payment.',
  },
  'hawaii': {
    name: 'Hawaii',
    abbr: 'HI',
    taxRate: '1.4% - 11%',
    hasStateTax: true,
    majorCities: ['Honolulu', 'Pearl City', 'Hilo', 'Kailua'],
    population: '1.4 million',
    minWage: '$14.00',
    compliance: 'Hawaii requires detailed pay statements including hours, wages, and all deductions.',
  },
  'idaho': {
    name: 'Idaho',
    abbr: 'ID',
    taxRate: '5.8%',
    hasStateTax: true,
    majorCities: ['Boise', 'Meridian', 'Nampa', 'Idaho Falls'],
    population: '1.9 million',
    minWage: '$7.25',
    compliance: 'Idaho follows federal requirements for pay documentation.',
  },
  'illinois': {
    name: 'Illinois',
    abbr: 'IL',
    taxRate: '4.95%',
    hasStateTax: true,
    majorCities: ['Chicago', 'Aurora', 'Naperville', 'Rockford'],
    population: '12.6 million',
    minWage: '$14.00',
    compliance: 'Illinois requires employers to provide itemized pay stubs with hours worked, pay rates, and deductions.',
  },
  'indiana': {
    name: 'Indiana',
    abbr: 'IN',
    taxRate: '3.05%',
    hasStateTax: true,
    majorCities: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend'],
    population: '6.8 million',
    minWage: '$7.25',
    compliance: 'Indiana requires employers to provide written pay statements with each wage payment.',
  },
  'iowa': {
    name: 'Iowa',
    abbr: 'IA',
    taxRate: '4.4% - 5.7%',
    hasStateTax: true,
    majorCities: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City'],
    population: '3.2 million',
    minWage: '$7.25',
    compliance: 'Iowa requires employers to provide detailed wage statements with each pay period.',
  },
  'kansas': {
    name: 'Kansas',
    abbr: 'KS',
    taxRate: '3.1% - 5.7%',
    hasStateTax: true,
    majorCities: ['Wichita', 'Overland Park', 'Kansas City', 'Topeka'],
    population: '2.9 million',
    minWage: '$7.25',
    compliance: 'Kansas requires itemized pay statements showing gross wages and deductions.',
  },
  'kentucky': {
    name: 'Kentucky',
    abbr: 'KY',
    taxRate: '4%',
    hasStateTax: true,
    majorCities: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro'],
    population: '4.5 million',
    minWage: '$7.25',
    compliance: 'Kentucky requires employers to provide detailed earnings statements with each payment.',
  },
  'louisiana': {
    name: 'Louisiana',
    abbr: 'LA',
    taxRate: '1.85% - 4.25%',
    hasStateTax: true,
    majorCities: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette'],
    population: '4.6 million',
    minWage: '$7.25',
    compliance: 'Louisiana requires employers to provide itemized statements of earnings and deductions.',
  },
  'maine': {
    name: 'Maine',
    abbr: 'ME',
    taxRate: '5.8% - 7.15%',
    hasStateTax: true,
    majorCities: ['Portland', 'Lewiston', 'Bangor', 'Auburn'],
    population: '1.4 million',
    minWage: '$14.15',
    compliance: 'Maine requires detailed pay statements with every wage payment.',
  },
  'maryland': {
    name: 'Maryland',
    abbr: 'MD',
    taxRate: '2% - 5.75%',
    hasStateTax: true,
    majorCities: ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg'],
    population: '6.2 million',
    minWage: '$15.00',
    compliance: 'Maryland requires employers to provide written statements showing hours, wages, and deductions.',
  },
  'massachusetts': {
    name: 'Massachusetts',
    abbr: 'MA',
    taxRate: '5%',
    hasStateTax: true,
    majorCities: ['Boston', 'Worcester', 'Springfield', 'Cambridge'],
    population: '7.0 million',
    minWage: '$15.00',
    compliance: 'Massachusetts requires detailed pay stubs including hours worked, gross/net pay, and itemized deductions.',
  },
  'michigan': {
    name: 'Michigan',
    abbr: 'MI',
    taxRate: '4.25%',
    hasStateTax: true,
    majorCities: ['Detroit', 'Grand Rapids', 'Warren', 'Ann Arbor'],
    population: '10.0 million',
    minWage: '$10.33',
    compliance: 'Michigan requires employers to provide itemized pay statements with each payment.',
  },
  'minnesota': {
    name: 'Minnesota',
    abbr: 'MN',
    taxRate: '5.35% - 9.85%',
    hasStateTax: true,
    majorCities: ['Minneapolis', 'St. Paul', 'Rochester', 'Duluth'],
    population: '5.7 million',
    minWage: '$10.85',
    compliance: 'Minnesota requires comprehensive earnings statements with each wage payment.',
  },
  'mississippi': {
    name: 'Mississippi',
    abbr: 'MS',
    taxRate: '4% - 5%',
    hasStateTax: true,
    majorCities: ['Jackson', 'Gulfport', 'Southaven', 'Biloxi'],
    population: '2.9 million',
    minWage: '$7.25',
    compliance: 'Mississippi follows federal pay stub requirements.',
  },
  'missouri': {
    name: 'Missouri',
    abbr: 'MO',
    taxRate: '2% - 4.95%',
    hasStateTax: true,
    majorCities: ['Kansas City', 'St. Louis', 'Springfield', 'Columbia'],
    population: '6.2 million',
    minWage: '$12.30',
    compliance: 'Missouri requires employers to provide itemized wage statements.',
  },
  'montana': {
    name: 'Montana',
    abbr: 'MT',
    taxRate: '4.7% - 5.9%',
    hasStateTax: true,
    majorCities: ['Billings', 'Missoula', 'Great Falls', 'Bozeman'],
    population: '1.1 million',
    minWage: '$10.30',
    compliance: 'Montana requires detailed pay statements with each wage payment.',
  },
  'nebraska': {
    name: 'Nebraska',
    abbr: 'NE',
    taxRate: '2.46% - 5.84%',
    hasStateTax: true,
    majorCities: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island'],
    population: '2.0 million',
    minWage: '$12.00',
    compliance: 'Nebraska requires employers to provide written wage statements.',
  },
  'nevada': {
    name: 'Nevada',
    abbr: 'NV',
    taxRate: '0%',
    hasStateTax: false,
    majorCities: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas'],
    population: '3.2 million',
    minWage: '$12.00',
    compliance: 'Nevada has no state income tax. Employers must provide written wage statements showing hours, wages, and deductions.',
  },
  'new-hampshire': {
    name: 'New Hampshire',
    abbr: 'NH',
    taxRate: '0%',
    hasStateTax: false,
    majorCities: ['Manchester', 'Nashua', 'Concord', 'Derry'],
    population: '1.4 million',
    minWage: '$7.25',
    compliance: 'New Hampshire has no state income tax on wages. Employers must provide itemized pay statements.',
  },
  'new-jersey': {
    name: 'New Jersey',
    abbr: 'NJ',
    taxRate: '1.4% - 10.75%',
    hasStateTax: true,
    majorCities: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth'],
    population: '9.3 million',
    minWage: '$15.13',
    compliance: 'New Jersey requires comprehensive pay statements with each wage payment.',
  },
  'new-mexico': {
    name: 'New Mexico',
    abbr: 'NM',
    taxRate: '1.7% - 5.9%',
    hasStateTax: true,
    majorCities: ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe'],
    population: '2.1 million',
    minWage: '$12.00',
    compliance: 'New Mexico requires employers to provide detailed wage statements.',
  },
  'new-york': {
    name: 'New York',
    abbr: 'NY',
    taxRate: '4% - 10.9%',
    hasStateTax: true,
    majorCities: ['New York City', 'Buffalo', 'Rochester', 'Syracuse'],
    population: '19.3 million',
    minWage: '$15.00',
    compliance: 'New York Labor Law Section 195 requires detailed pay stubs including hours, rates, deductions, and employer information.',
  },
  'north-carolina': {
    name: 'North Carolina',
    abbr: 'NC',
    taxRate: '4.75%',
    hasStateTax: true,
    majorCities: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham'],
    population: '10.7 million',
    minWage: '$7.25',
    compliance: 'North Carolina requires employers to provide itemized wage statements.',
  },
  'north-dakota': {
    name: 'North Dakota',
    abbr: 'ND',
    taxRate: '1.1% - 2.5%',
    hasStateTax: true,
    majorCities: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot'],
    population: '779,000',
    minWage: '$7.25',
    compliance: 'North Dakota requires written earnings statements with each payment.',
  },
  'ohio': {
    name: 'Ohio',
    abbr: 'OH',
    taxRate: '0% - 3.5%',
    hasStateTax: true,
    majorCities: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo'],
    population: '11.8 million',
    minWage: '$10.45',
    compliance: 'Ohio requires employers to provide itemized pay statements showing hours, wages, and deductions.',
  },
  'oklahoma': {
    name: 'Oklahoma',
    abbr: 'OK',
    taxRate: '0.25% - 4.75%',
    hasStateTax: true,
    majorCities: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow'],
    population: '4.0 million',
    minWage: '$7.25',
    compliance: 'Oklahoma requires employers to provide itemized wage statements.',
  },
  'oregon': {
    name: 'Oregon',
    abbr: 'OR',
    taxRate: '4.75% - 9.9%',
    hasStateTax: true,
    majorCities: ['Portland', 'Salem', 'Eugene', 'Gresham'],
    population: '4.2 million',
    minWage: '$14.20',
    compliance: 'Oregon requires detailed itemized pay statements with each wage payment.',
  },
  'pennsylvania': {
    name: 'Pennsylvania',
    abbr: 'PA',
    taxRate: '3.07%',
    hasStateTax: true,
    majorCities: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Reading'],
    population: '13.0 million',
    minWage: '$7.25',
    compliance: 'Pennsylvania requires employers to provide written wage statements.',
  },
  'rhode-island': {
    name: 'Rhode Island',
    abbr: 'RI',
    taxRate: '3.75% - 5.99%',
    hasStateTax: true,
    majorCities: ['Providence', 'Warwick', 'Cranston', 'Pawtucket'],
    population: '1.1 million',
    minWage: '$14.00',
    compliance: 'Rhode Island requires itemized pay statements with each wage payment.',
  },
  'south-carolina': {
    name: 'South Carolina',
    abbr: 'SC',
    taxRate: '0% - 6.4%',
    hasStateTax: true,
    majorCities: ['Charleston', 'Columbia', 'North Charleston', 'Greenville'],
    population: '5.3 million',
    minWage: '$7.25',
    compliance: 'South Carolina requires employers to provide written wage statements.',
  },
  'south-dakota': {
    name: 'South Dakota',
    abbr: 'SD',
    taxRate: '0%',
    hasStateTax: false,
    majorCities: ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings'],
    population: '909,000',
    minWage: '$11.20',
    compliance: 'South Dakota has no state income tax. Employers follow federal pay stub guidelines.',
  },
  'tennessee': {
    name: 'Tennessee',
    abbr: 'TN',
    taxRate: '0%',
    hasStateTax: false,
    majorCities: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga'],
    population: '7.1 million',
    minWage: '$7.25',
    compliance: 'Tennessee has no state income tax. Employers should provide documentation per federal requirements.',
  },
  'texas': {
    name: 'Texas',
    abbr: 'TX',
    taxRate: '0%',
    hasStateTax: false,
    majorCities: ['Houston', 'San Antonio', 'Dallas', 'Austin'],
    population: '30.5 million',
    minWage: '$7.25',
    compliance: 'Texas has no state income tax. While specific pay stub laws are minimal, employers must comply with federal FLSA requirements.',
  },
  'utah': {
    name: 'Utah',
    abbr: 'UT',
    taxRate: '4.65%',
    hasStateTax: true,
    majorCities: ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan'],
    population: '3.4 million',
    minWage: '$7.25',
    compliance: 'Utah requires employers to provide itemized pay statements.',
  },
  'vermont': {
    name: 'Vermont',
    abbr: 'VT',
    taxRate: '3.35% - 8.75%',
    hasStateTax: true,
    majorCities: ['Burlington', 'South Burlington', 'Rutland', 'Barre'],
    population: '647,000',
    minWage: '$13.67',
    compliance: 'Vermont requires detailed itemized pay statements with each wage payment.',
  },
  'virginia': {
    name: 'Virginia',
    abbr: 'VA',
    taxRate: '2% - 5.75%',
    hasStateTax: true,
    majorCities: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond'],
    population: '8.6 million',
    minWage: '$12.00',
    compliance: 'Virginia requires employers to provide itemized pay statements showing wages and deductions.',
  },
  'washington': {
    name: 'Washington',
    abbr: 'WA',
    taxRate: '0%',
    hasStateTax: false,
    majorCities: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver'],
    population: '7.8 million',
    minWage: '$16.28',
    compliance: 'Washington has no state income tax. Employers must provide detailed pay statements showing hours, pay rate, and deductions.',
  },
  'west-virginia': {
    name: 'West Virginia',
    abbr: 'WV',
    taxRate: '2.36% - 5.12%',
    hasStateTax: true,
    majorCities: ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg'],
    population: '1.8 million',
    minWage: '$8.75',
    compliance: 'West Virginia requires employers to provide itemized wage statements.',
  },
  'wisconsin': {
    name: 'Wisconsin',
    abbr: 'WI',
    taxRate: '3.54% - 7.65%',
    hasStateTax: true,
    majorCities: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha'],
    population: '5.9 million',
    minWage: '$7.25',
    compliance: 'Wisconsin requires employers to provide written wage statements with each payment.',
  },
  'wyoming': {
    name: 'Wyoming',
    abbr: 'WY',
    taxRate: '0%',
    hasStateTax: false,
    majorCities: ['Cheyenne', 'Casper', 'Laramie', 'Gillette'],
    population: '577,000',
    minWage: '$7.25',
    compliance: 'Wyoming has no state income tax. Employers follow federal pay stub requirements.',
  },
  'canada': {
    name: 'Canada',
    abbr: 'CA',
    taxRate: '15% - 33% Federal',
    hasStateTax: true,
    majorCities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary'],
    population: '40 million',
    minWage: 'Varies by province',
    compliance: 'Canadian employers must provide pay stubs showing gross pay, deductions (CPP, EI, income tax), and net pay per provincial Employment Standards Acts.',
  },
};

export default function StatePaystubGenerator() {
  const { state } = useParams();
  const stateInfo = stateData[state];

  // If state not found, show 404-like content
  if (!stateInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">State Not Found</h1>
          <p className="text-gray-600 mb-8">The requested state page does not exist.</p>
          <Link to="/paystub-generator" className="text-green-700 hover:underline">
            Go to Paystub Generator
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isCanada = state === 'canada';
  const locationWord = isCanada ? 'province' : 'state';
  const taxWord = stateInfo.hasStateTax ? `${stateInfo.taxRate} state income tax` : 'no state income tax';

  return (
    <>
      <Helmet>
        <title>{stateInfo.name} Paystub Generator | Create {stateInfo.abbr} Pay Stubs Online | MintSlip</title>
        <meta name="description" content={`Generate professional pay stubs for ${stateInfo.name} (${stateInfo.abbr}). ${stateInfo.hasStateTax ? `Accurate ${stateInfo.taxRate} tax calculations.` : 'No state income tax calculations needed.'} Used by renters & contractors in ${stateInfo.name}. Instant PDF download.`} />
        <meta name="keywords" content={`${stateInfo.name} paystub generator, ${stateInfo.abbr} pay stub maker, ${stateInfo.name} paycheck generator, ${stateInfo.majorCities.join(' paystub, ')} paystub, ${stateInfo.name} contractor pay stub, ${stateInfo.name} self employed paystub`} />
        <link rel="canonical" href={`https://mintslip.com/paystub-generator/${state}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${stateInfo.name} Paystub Generator | MintSlip`} />
        <meta property="og:description" content={`Create professional pay stubs for ${stateInfo.name}. ${stateInfo.hasStateTax ? `Accurate ${stateInfo.taxRate} tax calculations.` : 'No state income tax.'} Trusted by renters & contractors.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://mintslip.com/paystub-generator/${state}`} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${stateInfo.name} Paystub Generator | MintSlip`} />
        <meta name="twitter:description" content={`Generate professional ${stateInfo.name} pay stubs online. Used by renters & contractors.`} />
        
        {/* Schema.org structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": `${stateInfo.name} Paystub Generator`,
            "description": `Professional paystub generator for ${stateInfo.name} residents and businesses`,
            "url": `https://mintslip.com/paystub-generator/${state}`,
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "7.99",
              "priceCurrency": "USD"
            },
            "areaServed": {
              "@type": isCanada ? "Country" : "State",
              "name": stateInfo.name
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Header />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-900 to-green-800 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {stateInfo.name} Paystub Generator
              </h1>
              <p className="text-xl text-green-100 mb-6">
                Create Professional Pay Stubs for {stateInfo.name} ({stateInfo.abbr}) in Minutes
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <span className="bg-green-700/50 px-4 py-2 rounded-full text-sm">
                  {stateInfo.hasStateTax ? `${stateInfo.taxRate} State Tax` : 'No State Income Tax'}
                </span>
                <span className="bg-green-700/50 px-4 py-2 rounded-full text-sm">
                  Min Wage: {stateInfo.minWage}
                </span>
                <span className="bg-green-700/50 px-4 py-2 rounded-full text-sm">
                  Instant PDF Download
                </span>
              </div>
              <p className="text-green-200 text-lg">
                Trusted by renters & contractors across {stateInfo.majorCities.slice(0, 3).join(', ')}, and all of {stateInfo.name}
              </p>
            </div>
          </div>
        </section>

        {/* Main Form Section */}
        <section className="py-8">
          <PaystubForm />
        </section>

        {/* SEO Content Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto prose prose-lg">
              
              {/* Introduction */}
              <h2 className="text-3xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Why Use MintSlip's {stateInfo.name} Paystub Generator?
              </h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Whether you're a small business owner in {stateInfo.majorCities[0]}, a freelancer in {stateInfo.majorCities[1]}, 
                or a contractor anywhere in {stateInfo.name}, our paystub generator helps you create professional, 
                accurate pay documentation in minutes. With {stateInfo.hasStateTax ? `${stateInfo.name}'s ${stateInfo.taxRate} state income tax rates` : `no state income tax in ${stateInfo.name}`}, 
                our calculator ensures your pay stubs reflect the correct withholdings and deductions.
              </p>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 gap-6 my-12 not-prose">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h3 className="font-bold text-gray-800">Accurate {stateInfo.abbr} Tax Calculations</h3>
                  </div>
                  <p className="text-gray-600">
                    {stateInfo.hasStateTax 
                      ? `Our system automatically calculates ${stateInfo.name}'s ${stateInfo.taxRate} state income tax along with federal taxes, Social Security, and Medicare.`
                      : `${stateInfo.name} has no state income tax, so we calculate federal taxes, Social Security, and Medicare accurately.`
                    }
                  </p>
                </div>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-6 h-6 text-green-600" />
                    <h3 className="font-bold text-gray-800">{stateInfo.name} Compliant</h3>
                  </div>
                  <p className="text-gray-600">
                    {stateInfo.compliance}
                  </p>
                </div>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="w-6 h-6 text-green-600" />
                    <h3 className="font-bold text-gray-800">Instant Generation</h3>
                  </div>
                  <p className="text-gray-600">
                    Create professional pay stubs in under 5 minutes. Perfect for {stateInfo.name} residents who need quick proof of income for apartment applications, loans, or business records.
                  </p>
                </div>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="w-6 h-6 text-green-600" />
                    <h3 className="font-bold text-gray-800">Professional Templates</h3>
                  </div>
                  <p className="text-gray-600">
                    Choose from multiple professional templates including Gusto, Workday, OnPay, and ADP styles that are recognized and accepted throughout {stateInfo.name}.
                  </p>
                </div>
              </div>

              {/* Who Uses Section */}
              <h2 className="text-3xl font-bold text-gray-800 mb-6 mt-12" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Who Uses Our {stateInfo.name} Paystub Generator?
              </h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Our paystub generator serves thousands of users across {stateInfo.name}, from the bustling streets of {stateInfo.majorCities[0]} 
                to the communities of {stateInfo.majorCities[stateInfo.majorCities.length - 1]}. Here's who benefits most:
              </p>

              <div className="grid md:grid-cols-3 gap-6 my-8 not-prose">
                <div className="text-center p-6">
                  <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h4 className="font-bold text-gray-800 mb-2">Renters in {stateInfo.name}</h4>
                  <p className="text-gray-600 text-sm">
                    Landlords in {stateInfo.majorCities[0]} and across {stateInfo.name} require proof of income. Our pay stubs are accepted by property managers statewide.
                  </p>
                </div>
                <div className="text-center p-6">
                  <Briefcase className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h4 className="font-bold text-gray-800 mb-2">Contractors & Freelancers</h4>
                  <p className="text-gray-600 text-sm">
                    Self-employed professionals throughout {stateInfo.name} use our generator for income verification and business documentation.
                  </p>
                </div>
                <div className="text-center p-6">
                  <Building className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h4 className="font-bold text-gray-800 mb-2">Small Businesses</h4>
                  <p className="text-gray-600 text-sm">
                    {stateInfo.name} small business owners rely on MintSlip for professional employee pay documentation.
                  </p>
                </div>
              </div>

              {/* Tax Information */}
              <h2 className="text-3xl font-bold text-gray-800 mb-6 mt-12" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Understanding {stateInfo.name} Tax Withholdings
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {stateInfo.hasStateTax ? (
                  <>
                    {stateInfo.name} has a {stateInfo.taxRate.includes('-') ? 'progressive' : 'flat'} state income tax rate of {stateInfo.taxRate}. 
                    When you use our paystub generator, we automatically calculate these state taxes along with:
                  </>
                ) : (
                  <>
                    {stateInfo.name} is one of the few states with no state income tax on wages, making it an attractive location for workers. 
                    However, you'll still need to account for federal taxes on your pay stubs:
                  </>
                )}
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li><strong>Federal Income Tax:</strong> Based on your W-4 filing status and allowances</li>
                <li><strong>Social Security Tax:</strong> 6.2% on wages up to the annual limit</li>
                <li><strong>Medicare Tax:</strong> 1.45% on all wages (plus 0.9% additional Medicare tax on high earners)</li>
                {stateInfo.hasStateTax && (
                  <li><strong>{stateInfo.name} State Tax:</strong> {stateInfo.taxRate} based on income brackets</li>
                )}
              </ul>

              {/* Cities Section */}
              <h2 className="text-3xl font-bold text-gray-800 mb-6 mt-12" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Serving All of {stateInfo.name}
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our paystub generator is used by residents and businesses across all of {stateInfo.name}, including:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6 not-prose">
                {stateInfo.majorCities.map((city, index) => (
                  <div key={index} className="bg-green-50 text-green-800 px-4 py-2 rounded-lg text-center font-medium">
                    {city}
                  </div>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">
                No matter where you're located in {stateInfo.name}, our calculator uses accurate {stateInfo.hasStateTax ? 'state and' : ''} federal 
                tax rates to ensure your pay stubs are precise and professional.
              </p>

              {/* Compliance Section */}
              <h2 className="text-3xl font-bold text-gray-800 mb-6 mt-12" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {stateInfo.name} Pay Stub Compliance
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {stateInfo.compliance}
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our {stateInfo.name} paystub generator includes all the information typically required:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Employee name and address</li>
                <li>Employer name, address, and identification</li>
                <li>Pay period dates (start and end)</li>
                <li>Hours worked (for hourly employees)</li>
                <li>Gross wages earned</li>
                <li>Itemized deductions (federal tax, {stateInfo.hasStateTax ? 'state tax, ' : ''}Social Security, Medicare)</li>
                <li>Net pay amount</li>
                <li>Year-to-date totals</li>
              </ul>

              {/* Use Cases */}
              <h2 className="text-3xl font-bold text-gray-800 mb-6 mt-12" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Common Uses for {stateInfo.name} Pay Stubs
              </h2>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 my-6">
                <h3 className="font-bold text-gray-800 mb-4">Rental Applications</h3>
                <p className="text-gray-700">
                  Landlords across {stateInfo.name}, especially in competitive markets like {stateInfo.majorCities[0]}, 
                  require proof of income. Our professional pay stubs help you secure your dream apartment by providing 
                  clear documentation of your earnings. Most {stateInfo.name} landlords request 2-3 recent pay stubs 
                  showing income that's at least 2.5x the monthly rent.
                </p>
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 my-6">
                <h3 className="font-bold text-gray-800 mb-4">Loan Applications</h3>
                <p className="text-gray-700">
                  Whether you're applying for a car loan in {stateInfo.majorCities[1]} or a personal loan from a {stateInfo.name} 
                  credit union, lenders need to verify your income. Our pay stubs provide the professional documentation 
                  banks and credit unions trust.
                </p>
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 my-6">
                <h3 className="font-bold text-gray-800 mb-4">Self-Employment Documentation</h3>
                <p className="text-gray-700">
                  Freelancers and independent contractors throughout {stateInfo.name} often need to create their own income 
                  documentation. Our generator helps self-employed professionals maintain proper records for tax purposes 
                  and income verification.
                </p>
              </div>

              {/* CTA Section */}
              <div className="bg-gradient-to-r from-green-800 to-green-700 text-white p-8 rounded-2xl my-12 text-center not-prose">
                <h3 className="text-2xl font-bold mb-4">Ready to Create Your {stateInfo.name} Pay Stub?</h3>
                <p className="text-green-100 mb-6">
                  Join thousands of {stateInfo.name} residents who trust MintSlip for their pay stub needs.
                </p>
                <Link 
                  to="/paystub-generator" 
                  className="inline-block bg-white text-green-800 px-8 py-3 rounded-lg font-bold hover:bg-green-50 transition-colors"
                >
                  Generate Pay Stub Now
                </Link>
              </div>

              {/* FAQ Section */}
              <h2 className="text-3xl font-bold text-gray-800 mb-6 mt-12" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Frequently Asked Questions About {stateInfo.name} Pay Stubs
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Is it legal to generate my own pay stubs in {stateInfo.name}?</h3>
                  <p className="text-gray-700">
                    Yes, it is legal to create pay stubs for legitimate income documentation purposes in {stateInfo.name}. 
                    Small business owners, self-employed individuals, and contractors often need to generate their own 
                    pay documentation. However, pay stubs must accurately reflect actual earnings and should never be 
                    used fraudulently.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">How accurate are the tax calculations for {stateInfo.name}?</h3>
                  <p className="text-gray-700">
                    Our system uses current {stateInfo.hasStateTax ? `${stateInfo.name} state tax rates (${stateInfo.taxRate}) and` : ''} federal 
                    tax brackets to calculate withholdings. We regularly update our tax tables to ensure accuracy. 
                    For complex tax situations, we recommend consulting with a {stateInfo.name} tax professional.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Will {stateInfo.name} landlords accept these pay stubs?</h3>
                  <p className="text-gray-700">
                    Our pay stubs are designed to meet professional standards and include all the information 
                    landlords typically require. They're accepted by property managers across {stateInfo.majorCities.join(', ')}, 
                    and throughout {stateInfo.name}. Each pay stub includes employer information, pay period details, 
                    gross/net wages, and itemized deductions.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">What's the minimum wage in {stateInfo.name}?</h3>
                  <p className="text-gray-700">
                    The current minimum wage in {stateInfo.name} is {stateInfo.minWage} per hour. Our paystub generator 
                    accommodates any hourly rate, though we recommend ensuring your documented wages comply with 
                    {stateInfo.name}'s minimum wage laws.
                  </p>
                </div>
              </div>

              {/* Final CTA */}
              <div className="border-t border-gray-200 pt-8 mt-12">
                <p className="text-center text-gray-600">
                  Need pay stubs for another state? We serve all 50 US states with accurate tax calculations.
                  <br />
                  <Link to="/paystub-generator" className="text-green-700 hover:underline font-medium">
                    Start Generating Your Pay Stubs Today →
                  </Link>
                </p>
              </div>

            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
