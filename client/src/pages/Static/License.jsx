import { Link } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, combineSchemas, webPageSchema } from '../../seo/schemas';
import { ROUTES } from '../../constants';

const TITLE = 'Open Source License';
const DESCRIPTION = 'EduRozgaar is open source software licensed under the MIT License.';
const COPYRIGHT = 'Copyright (c) 2026 Syed Daniyal Abbas';
const REPO_URL = 'https://github.com/SyedDaniyal31/EduRozgaar';

export default function License() {
  return (
    <>
      <SeoHead
        title={TITLE}
        description={DESCRIPTION}
        canonical={ROUTES.LICENSE}
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: 'Home', url: ROUTES.HOME },
            { name: 'License', url: ROUTES.LICENSE },
          ]),
          webPageSchema({ name: TITLE, description: DESCRIPTION, url: ROUTES.LICENSE })
        )}
      />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">MIT License</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          {COPYRIGHT} ·{' '}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-primary dark:text-mint hover:underline">
            View on GitHub
          </a>
        </p>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 md:p-8">
          <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
{`MIT License

${COPYRIGHT}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
          </pre>
        </div>
        <p className="mt-8 text-gray-600 dark:text-gray-400 text-sm">
          EduRozgaar is a student-first platform for jobs, scholarships, and education in Pakistan.
          The source code is available under the MIT License. See also our{' '}
          <Link to={ROUTES.TERMS} className="text-primary dark:text-mint hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link to={ROUTES.PRIVACY_POLICY} className="text-primary dark:text-mint hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </>
  );
}
