/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { shallow } from 'enzyme';
import { SavedObjectsClientContract } from '../../../../../core/public';
import React from 'react';
import IndexPatternSelect from './index_pattern_select';

describe('IndexPatternSelect', () => {
  let client: SavedObjectsClientContract;
  const bulkGetMock = jest.fn();

  // `debouncedFetch` waits 300ms and then awaits two round trips, so sleeping for exactly
  // the debounce interval races the assertion on a loaded machine. Retry instead.
  const eventually = async (assertion: () => void, timeout = 3000) => {
    const deadline = Date.now() + timeout;
    for (;;) {
      try {
        assertion();
        return;
      } catch (error) {
        if (Date.now() > deadline) throw error;
        await new Promise((res) => setTimeout(res, 20));
      }
    }
  };

  beforeEach(() => {
    client = {
      find: jest.fn().mockResolvedValue({
        savedObjects: [
          {
            references: [{ id: 'testDataSourceId', type: 'data-source' }],
            attributes: { title: 'testTitle1' },
          },
          {
            references: [{ id: 'testDataSourceId', type: 'data-source' }],
            attributes: { title: 'testTitle2' },
          },
        ],
      }),
      bulkGet: bulkGetMock,
      get: jest.fn().mockResolvedValue({
        references: [{ id: 'someId', type: 'data-source' }],
        attributes: { title: 'testTitle' },
      }),
    } as any;
  });

  it('should render index pattern select', async () => {
    const onChangeMock = jest.fn();
    const compInstance = shallow(
      <IndexPatternSelect
        placeholder={'test index pattern'}
        indexPatternId={'testId'}
        onChange={onChangeMock}
        data-test-subj={'testId'}
        savedObjectsClient={client}
      />
    ).instance();

    bulkGetMock.mockResolvedValue({ savedObjects: [{ attributes: { title: 'test1' } }] });
    compInstance.debouncedFetch('');
    await eventually(() =>
      expect(bulkGetMock).toBeCalledWith([{ id: 'testDataSourceId', type: 'data-source' }])
    );
  });
});
